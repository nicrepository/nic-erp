package com.niclabs.erp.fiscal.service;

import com.niclabs.erp.auth.domain.User;
import com.niclabs.erp.common.SecurityUtils;
import com.niclabs.erp.exception.BusinessException;
import com.niclabs.erp.exception.ResourceNotFoundException;
import com.niclabs.erp.fiscal.domain.FiscalAttachmentType;
import com.niclabs.erp.fiscal.domain.FiscalInvoice;
import com.niclabs.erp.fiscal.domain.FiscalInvoiceAttachment;
import com.niclabs.erp.fiscal.domain.FiscalInvoiceItem;
import com.niclabs.erp.fiscal.domain.FiscalInvoiceStatus;
import com.niclabs.erp.fiscal.domain.Supplier;
import com.niclabs.erp.fiscal.dto.FiscalInvoiceAttachmentResponseDTO;
import com.niclabs.erp.fiscal.dto.FiscalInvoiceItemDTO;
import com.niclabs.erp.fiscal.dto.FiscalInvoiceRequestDTO;
import com.niclabs.erp.fiscal.dto.FiscalInvoiceResponseDTO;
import com.niclabs.erp.fiscal.dto.FiscalReconciliationResponseDTO;
import com.niclabs.erp.fiscal.dto.SupplierRequestDTO;
import com.niclabs.erp.fiscal.dto.SupplierResponseDTO;
import com.niclabs.erp.fiscal.repository.FiscalInvoiceRepository;
import com.niclabs.erp.fiscal.repository.SupplierRepository;
import com.niclabs.erp.inventory.service.IStockItemService;
import com.niclabs.erp.purchasing.domain.PurchaseOrder;
import com.niclabs.erp.purchasing.domain.PurchaseOrderStatus;
import com.niclabs.erp.purchasing.repository.PurchaseOrderRepository;
import com.niclabs.erp.storage.service.IStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FiscalService implements IFiscalService {

    private final SupplierRepository supplierRepository;
    private final FiscalInvoiceRepository invoiceRepository;
    private final IStorageService storageService;
    private final IStockItemService stockItemService;
    private final PurchaseOrderRepository purchaseOrderRepository;

    @Transactional
    public SupplierResponseDTO createSupplier(SupplierRequestDTO dto) {
        String document = normalizeDocument(dto.document());
        supplierRepository.findByDocument(document).ifPresent(existing -> {
            throw new BusinessException("Já existe um fornecedor com este CNPJ/CPF.");
        });

        Supplier supplier = new Supplier();
        supplier.setId(UUID.randomUUID());
        applySupplierData(supplier, dto, document);
        return SupplierResponseDTO.fromEntity(supplierRepository.save(supplier));
    }

    @Transactional
    public SupplierResponseDTO updateSupplier(UUID id, SupplierRequestDTO dto) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fornecedor não encontrado"));
        String document = normalizeDocument(dto.document());
        supplierRepository.findByDocument(document)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new BusinessException("Já existe um fornecedor com este CNPJ/CPF.");
                });

        applySupplierData(supplier, dto, document);
        return SupplierResponseDTO.fromEntity(supplierRepository.save(supplier));
    }

    @Transactional
    public void deactivateSupplier(UUID id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fornecedor não encontrado"));
        supplier.setActive(false);
        supplierRepository.save(supplier);
    }

    @Transactional(readOnly = true)
    public Page<SupplierResponseDTO> findSuppliers(String search, Pageable pageable) {
        String normalized = normalizeSearch(search);
        Page<Supplier> suppliers = normalized.isBlank()
                ? supplierRepository.findAll(pageable)
                : supplierRepository.search(normalized, pageable);
        return suppliers.map(SupplierResponseDTO::fromEntity);
    }

    @Transactional
    public FiscalInvoiceResponseDTO createInvoice(FiscalInvoiceRequestDTO dto) {
        Supplier supplier = supplierRepository.findById(dto.supplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Fornecedor não encontrado"));
        if (!supplier.isActive()) {
            throw new BusinessException("Não é possível cadastrar nota para fornecedor inativo.");
        }

        invoiceRepository.findBySupplierIdAndNumberAndSeries(supplier.getId(), dto.number(), dto.series())
                .ifPresent(existing -> {
                    throw new BusinessException("Já existe uma nota com este fornecedor, número e série.");
                });

        FiscalInvoice invoice = new FiscalInvoice();
        invoice.setId(UUID.randomUUID());
        invoice.setSupplier(supplier);
        invoice.setCreatedBy(SecurityUtils.getCurrentUser().getId());
        applyInvoiceData(invoice, dto);

        return FiscalInvoiceResponseDTO.fromEntity(invoiceRepository.save(invoice));
    }

    @Transactional
    public FiscalInvoiceResponseDTO updateInvoice(UUID id, FiscalInvoiceRequestDTO dto) {
        FiscalInvoice invoice = getInvoiceEntity(id);
        ensureEditable(invoice);

        Supplier supplier = supplierRepository.findById(dto.supplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Fornecedor não encontrado"));
        invoice.setSupplier(supplier);
        applyInvoiceData(invoice, dto);

        return FiscalInvoiceResponseDTO.fromEntity(invoiceRepository.save(invoice));
    }

    @Transactional
    public FiscalInvoiceResponseDTO updateInvoiceStatus(UUID id, FiscalInvoiceStatus status, String divergenceNotes) {
        FiscalInvoice invoice = getInvoiceEntity(id);
        if (invoice.getStatus() == FiscalInvoiceStatus.LAUNCHED) {
            throw new BusinessException("Notas lançadas não podem ter o status alterado.");
        }
        invoice.setStatus(status);
        invoice.setDivergenceNotes(divergenceNotes);
        return FiscalInvoiceResponseDTO.fromEntity(invoiceRepository.save(invoice));
    }

    @Transactional
    public FiscalInvoiceResponseDTO launchInvoice(UUID id) {
        FiscalInvoice invoice = getInvoiceEntity(id);
        if (invoice.getStatus() == FiscalInvoiceStatus.LAUNCHED) {
            throw new BusinessException("Nota fiscal já lançada.");
        }
        if (invoice.getStatus() != FiscalInvoiceStatus.VALIDATED) {
            throw new BusinessException("A nota precisa estar validada antes do lançamento.");
        }
        FiscalReconciliationResponseDTO reconciliation = FiscalReconciliationResponseDTO.fromEntity(invoice);
        if (invoice.getPurchaseOrder() != null && reconciliation.hasBlockingDivergence()) {
            throw new BusinessException("A nota fiscal possui divergências na conciliação com o pedido de compra.");
        }

        for (FiscalInvoiceItem item : invoice.getItems()) {
            if (!item.isEntersStock()) continue;
            if (item.getStockItemId() == null) {
                throw new BusinessException("Itens que entram no estoque precisam estar vinculados a um material.");
            }
            stockItemService.addStockFromFiscal(
                    item.getStockItemId(),
                    toStockQuantity(item.getQuantity()),
                    item.getUnitValue(),
                    invoice.getId(),
                    "NF " + invoice.getNumber()
            );
        }

        User currentUser = SecurityUtils.getCurrentUser();
        invoice.setStatus(FiscalInvoiceStatus.LAUNCHED);
        invoice.setLaunchedBy(currentUser.getId());
        invoice.setLaunchedAt(LocalDateTime.now());
        if (invoice.getPurchaseOrder() != null) {
            invoice.getPurchaseOrder().setStatus(PurchaseOrderStatus.LINKED_TO_INVOICE);
        }
        return FiscalInvoiceResponseDTO.fromEntity(invoiceRepository.save(invoice));
    }

    @Transactional(readOnly = true)
    public FiscalInvoiceResponseDTO getInvoice(UUID id) {
        return FiscalInvoiceResponseDTO.fromEntity(getInvoiceEntity(id));
    }

    @Transactional(readOnly = true)
    public Page<FiscalInvoiceResponseDTO> findInvoices(String search, FiscalInvoiceStatus status, Pageable pageable) {
        String normalized = normalizeSearch(search);
        Page<FiscalInvoice> invoices = normalized.isBlank()
                ? invoiceRepository.findByOptionalStatus(status, pageable)
                : invoiceRepository.search(normalized, status, pageable);
        return invoices.map(FiscalInvoiceResponseDTO::fromEntity);
    }

    @Transactional
    public FiscalInvoiceAttachmentResponseDTO addAttachment(UUID invoiceId, FiscalAttachmentType type, MultipartFile file) {
        FiscalInvoice invoice = getInvoiceEntity(invoiceId);
        ensureEditable(invoice);

        String storedFileName = storageService.store(file);
        FiscalInvoiceAttachment attachment = new FiscalInvoiceAttachment();
        attachment.setId(UUID.randomUUID());
        attachment.setInvoice(invoice);
        attachment.setFileName(storedFileName);
        attachment.setOriginalName(file.getOriginalFilename() == null ? "arquivo" : file.getOriginalFilename());
        attachment.setContentType(file.getContentType());
        attachment.setAttachmentType(type);
        attachment.setUploadedBy(SecurityUtils.getCurrentUser().getId());
        invoice.getAttachments().add(attachment);
        invoiceRepository.save(invoice);

        return FiscalInvoiceAttachmentResponseDTO.fromEntity(attachment);
    }

    private FiscalInvoice getInvoiceEntity(UUID id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Nota fiscal não encontrada"));
    }

    private void applySupplierData(Supplier supplier, SupplierRequestDTO dto, String document) {
        supplier.setLegalName(trim(dto.legalName()));
        supplier.setTradeName(trim(dto.tradeName()));
        supplier.setDocument(document);
        supplier.setStateRegistration(trim(dto.stateRegistration()));
        supplier.setMunicipalRegistration(trim(dto.municipalRegistration()));
        supplier.setFiscalEmail(trim(dto.fiscalEmail()));
        supplier.setPhone(trim(dto.phone()));
        supplier.setContactName(trim(dto.contactName()));
        supplier.setCategory(trim(dto.category()));
        supplier.setStreet(trim(dto.street()));
        supplier.setNumber(trim(dto.number()));
        supplier.setComplement(trim(dto.complement()));
        supplier.setDistrict(trim(dto.district()));
        supplier.setCity(trim(dto.city()));
        supplier.setState(trim(dto.state()));
        supplier.setZipCode(trim(dto.zipCode()));
        supplier.setNotes(trim(dto.notes()));
        supplier.setActive(dto.active() == null || dto.active());
    }

    private void applyInvoiceData(FiscalInvoice invoice, FiscalInvoiceRequestDTO dto) {
        invoice.setNumber(trim(dto.number()));
        invoice.setPurchaseOrder(resolvePurchaseOrder(dto.purchaseOrderId()));
        invoice.setSeries(trim(dto.series()));
        invoice.setAccessKey(trim(dto.accessKey()));
        invoice.setInvoiceType(dto.invoiceType());
        invoice.setStatus(dto.status() == null ? FiscalInvoiceStatus.RECEIVED : dto.status());
        invoice.setIssueDate(dto.issueDate());
        invoice.setReceivedDate(dto.receivedDate());
        invoice.setProductValue(money(dto.productValue()));
        invoice.setFreightValue(money(dto.freightValue()));
        invoice.setDiscountValue(money(dto.discountValue()));
        invoice.setTaxValue(money(dto.taxValue()));
        invoice.setTotalValue(dto.totalValue() == null ? calculateTotal(dto) : money(dto.totalValue()));
        invoice.setCostCenter(trim(dto.costCenter()));
        invoice.setPurchaseOrderReference(trim(dto.purchaseOrderReference()));
        invoice.setNotes(trim(dto.notes()));
        invoice.setDivergenceNotes(trim(dto.divergenceNotes()));

        invoice.getItems().clear();
        if (dto.items() != null) {
            for (FiscalInvoiceItemDTO itemDTO : dto.items()) {
                FiscalInvoiceItem item = new FiscalInvoiceItem();
                item.setId(itemDTO.id() == null ? UUID.randomUUID() : itemDTO.id());
                item.setInvoice(invoice);
                item.setStockItemId(itemDTO.stockItemId());
                item.setDescription(trim(itemDTO.description()));
                item.setCategory(trim(itemDTO.category()));
                item.setQuantity(itemDTO.quantity());
                item.setUnitValue(money(itemDTO.unitValue()));
                item.setTotalValue(itemDTO.quantity().multiply(money(itemDTO.unitValue())).setScale(2, RoundingMode.HALF_UP));
                item.setNcm(trim(itemDTO.ncm()));
                item.setCfop(trim(itemDTO.cfop()));
                item.setEntersStock(itemDTO.entersStock());
                item.setPatrimony(itemDTO.patrimony());
                invoice.getItems().add(item);
            }
        }
    }

    private void ensureEditable(FiscalInvoice invoice) {
        if (invoice.getStatus() == FiscalInvoiceStatus.LAUNCHED || invoice.getStatus() == FiscalInvoiceStatus.CANCELLED) {
            throw new BusinessException("Notas lançadas ou canceladas não podem ser editadas.");
        }
    }

    private PurchaseOrder resolvePurchaseOrder(UUID purchaseOrderId) {
        if (purchaseOrderId == null) return null;
        return purchaseOrderRepository.findById(purchaseOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido de compra não encontrado"));
    }

    private int toStockQuantity(BigDecimal quantity) {
        try {
            return quantity.stripTrailingZeros().intValueExact();
        } catch (ArithmeticException ex) {
            throw new BusinessException("Itens vinculados ao estoque precisam ter quantidade inteira.");
        }
    }

    private BigDecimal calculateTotal(FiscalInvoiceRequestDTO dto) {
        return money(dto.productValue())
                .add(money(dto.freightValue()))
                .add(money(dto.taxValue()))
                .subtract(money(dto.discountValue()))
                .setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal money(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(2, RoundingMode.HALF_UP);
    }

    private String normalizeDocument(String document) {
        return document == null ? "" : document.replaceAll("\\D", "");
    }

    private String normalizeSearch(String search) {
        if (search == null) return "";
        String normalized = search.trim();
        return normalized.length() > 100 ? normalized.substring(0, 100) : normalized;
    }

    private String trim(String value) {
        return value == null ? null : value.trim();
    }
}
