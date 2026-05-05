package com.niclabs.erp.purchasing.service;

import com.niclabs.erp.common.SecurityUtils;
import com.niclabs.erp.exception.BusinessException;
import com.niclabs.erp.exception.ResourceNotFoundException;
import com.niclabs.erp.fiscal.domain.Supplier;
import com.niclabs.erp.fiscal.repository.SupplierRepository;
import com.niclabs.erp.purchasing.domain.PurchaseOrder;
import com.niclabs.erp.purchasing.domain.PurchaseOrderItem;
import com.niclabs.erp.purchasing.domain.PurchaseOrderStatus;
import com.niclabs.erp.purchasing.domain.PurchaseRequest;
import com.niclabs.erp.purchasing.domain.PurchaseRequestItem;
import com.niclabs.erp.purchasing.domain.PurchaseRequestStatus;
import com.niclabs.erp.purchasing.dto.PurchaseItemDTO;
import com.niclabs.erp.purchasing.dto.PurchaseOrderDTO;
import com.niclabs.erp.purchasing.dto.PurchaseOrderResponseDTO;
import com.niclabs.erp.purchasing.dto.PurchaseReceiptDTO;
import com.niclabs.erp.purchasing.dto.PurchaseReceiptItemDTO;
import com.niclabs.erp.purchasing.dto.PurchaseRequestDTO;
import com.niclabs.erp.purchasing.dto.PurchaseRequestResponseDTO;
import com.niclabs.erp.purchasing.repository.PurchaseOrderRepository;
import com.niclabs.erp.purchasing.repository.PurchaseRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PurchasingService implements IPurchasingService {

    private final PurchaseRequestRepository requestRepository;
    private final PurchaseOrderRepository orderRepository;
    private final SupplierRepository supplierRepository;

    @Transactional
    public PurchaseRequestResponseDTO createRequest(PurchaseRequestDTO dto) {
        PurchaseRequest request = new PurchaseRequest();
        request.setId(UUID.randomUUID());
        request.setRequestedBy(SecurityUtils.getCurrentUser().getId());
        request.setStatus(PurchaseRequestStatus.DRAFT);
        applyRequestData(request, dto);
        return PurchaseRequestResponseDTO.fromEntity(requestRepository.save(request));
    }

    @Transactional
    public PurchaseRequestResponseDTO updateRequest(UUID id, PurchaseRequestDTO dto) {
        PurchaseRequest request = getRequestEntity(id);
        if (request.getStatus() != PurchaseRequestStatus.DRAFT && request.getStatus() != PurchaseRequestStatus.REJECTED) {
            throw new BusinessException("Somente solicitações em rascunho ou reprovadas podem ser editadas.");
        }
        applyRequestData(request, dto);
        request.setStatus(PurchaseRequestStatus.DRAFT);
        return PurchaseRequestResponseDTO.fromEntity(requestRepository.save(request));
    }

    @Transactional
    public PurchaseRequestResponseDTO updateRequestStatus(UUID id, PurchaseRequestStatus status, String rejectionReason) {
        PurchaseRequest request = getRequestEntity(id);

        if (status == PurchaseRequestStatus.APPROVED) {
            if (request.getStatus() != PurchaseRequestStatus.SUBMITTED) {
                throw new BusinessException("Apenas solicitações enviadas podem ser aprovadas.");
            }
            request.setApprovedBy(SecurityUtils.getCurrentUser().getId());
            request.setApprovedAt(LocalDateTime.now());
        }

        if (status == PurchaseRequestStatus.REJECTED && (rejectionReason == null || rejectionReason.isBlank())) {
            throw new BusinessException("Informe o motivo da reprovação.");
        }

        request.setStatus(status);
        request.setRejectionReason(status == PurchaseRequestStatus.REJECTED ? rejectionReason : null);
        return PurchaseRequestResponseDTO.fromEntity(requestRepository.save(request));
    }

    @Transactional(readOnly = true)
    public PurchaseRequestResponseDTO getRequest(UUID id) {
        return PurchaseRequestResponseDTO.fromEntity(getRequestEntity(id));
    }

    @Transactional(readOnly = true)
    public Page<PurchaseRequestResponseDTO> findRequests(String search, PurchaseRequestStatus status, Pageable pageable) {
        String normalized = normalizeSearch(search);
        Page<PurchaseRequest> requests = normalized.isBlank()
                ? requestRepository.findByOptionalStatus(status, pageable)
                : requestRepository.search(normalized, status, pageable);
        return requests.map(PurchaseRequestResponseDTO::fromEntity);
    }

    @Transactional
    public PurchaseOrderResponseDTO createOrder(PurchaseOrderDTO dto) {
        orderRepository.findByNumber(dto.number()).ifPresent(existing -> {
            throw new BusinessException("Já existe um pedido com este número.");
        });

        PurchaseOrder order = new PurchaseOrder();
        order.setId(UUID.randomUUID());
        order.setCreatedBy(SecurityUtils.getCurrentUser().getId());
        applyOrderData(order, dto);

        if (order.getRequest() != null) {
            PurchaseRequest request = order.getRequest();
            if (request.getStatus() != PurchaseRequestStatus.APPROVED) {
                throw new BusinessException("A solicitação precisa estar aprovada para gerar pedido.");
            }
            request.setStatus(PurchaseRequestStatus.ORDERED);
        }

        return PurchaseOrderResponseDTO.fromEntity(orderRepository.save(order));
    }

    @Transactional
    public PurchaseOrderResponseDTO updateOrder(UUID id, PurchaseOrderDTO dto) {
        PurchaseOrder order = getOrderEntity(id);
        if (order.getStatus() == PurchaseOrderStatus.CLOSED || order.getStatus() == PurchaseOrderStatus.CANCELLED) {
            throw new BusinessException("Pedidos encerrados ou cancelados não podem ser editados.");
        }
        applyOrderData(order, dto);
        return PurchaseOrderResponseDTO.fromEntity(orderRepository.save(order));
    }

    @Transactional
    public PurchaseOrderResponseDTO updateOrderStatus(UUID id, PurchaseOrderStatus status) {
        PurchaseOrder order = getOrderEntity(id);
        order.setStatus(status);
        return PurchaseOrderResponseDTO.fromEntity(orderRepository.save(order));
    }

    @Transactional
    public PurchaseOrderResponseDTO receiveOrder(UUID id, PurchaseReceiptDTO dto) {
        PurchaseOrder order = getOrderEntity(id);
        if (order.getStatus() == PurchaseOrderStatus.CLOSED || order.getStatus() == PurchaseOrderStatus.CANCELLED) {
            throw new BusinessException("Pedidos encerrados ou cancelados não podem receber itens.");
        }

        Map<UUID, PurchaseOrderItem> itemsById = order.getItems().stream()
                .collect(Collectors.toMap(PurchaseOrderItem::getId, Function.identity()));

        for (PurchaseReceiptItemDTO itemDTO : dto.items()) {
            PurchaseOrderItem item = itemsById.get(itemDTO.orderItemId());
            if (item == null) {
                throw new BusinessException("Item recebido não pertence ao pedido informado.");
            }

            BigDecimal received = quantity(itemDTO.receivedQuantity());
            BigDecimal pending = item.getQuantity().subtract(item.getReceivedQuantity());
            if (received.compareTo(pending) > 0) {
                throw new BusinessException("Quantidade recebida não pode exceder o saldo pendente do item.");
            }
            item.setReceivedQuantity(item.getReceivedQuantity().add(received).setScale(3, RoundingMode.HALF_UP));
        }

        order.setStatus(resolveReceiptStatus(order));
        return PurchaseOrderResponseDTO.fromEntity(orderRepository.save(order));
    }

    @Transactional(readOnly = true)
    public PurchaseOrderResponseDTO getOrder(UUID id) {
        return PurchaseOrderResponseDTO.fromEntity(getOrderEntity(id));
    }

    @Transactional(readOnly = true)
    public Page<PurchaseOrderResponseDTO> findOrders(String search, PurchaseOrderStatus status, Pageable pageable) {
        String normalized = normalizeSearch(search);
        Page<PurchaseOrder> orders = normalized.isBlank()
                ? orderRepository.findByOptionalStatus(status, pageable)
                : orderRepository.search(normalized, status, pageable);
        return orders.map(PurchaseOrderResponseDTO::fromEntity);
    }

    private void applyRequestData(PurchaseRequest request, PurchaseRequestDTO dto) {
        request.setTitle(trim(dto.title()));
        request.setJustification(trim(dto.justification()));
        request.setCostCenter(trim(dto.costCenter()));
        request.getItems().clear();

        if (dto.items() != null) {
            for (PurchaseItemDTO itemDTO : dto.items()) {
                PurchaseRequestItem item = new PurchaseRequestItem();
                item.setId(itemDTO.id() == null ? UUID.randomUUID() : itemDTO.id());
                item.setRequest(request);
                item.setStockItemId(itemDTO.stockItemId());
                item.setDescription(trim(itemDTO.description()));
                item.setCategory(trim(itemDTO.category()));
                item.setQuantity(itemDTO.quantity());
                item.setEstimatedUnitValue(money(itemDTO.unitValue()));
                item.setEstimatedTotalValue(itemDTO.quantity().multiply(money(itemDTO.unitValue())).setScale(2, RoundingMode.HALF_UP));
                request.getItems().add(item);
            }
        }
    }

    private void applyOrderData(PurchaseOrder order, PurchaseOrderDTO dto) {
        Supplier supplier = supplierRepository.findById(dto.supplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Fornecedor não encontrado"));

        PurchaseRequest request = dto.requestId() == null ? null : getRequestEntity(dto.requestId());
        order.setRequest(request);
        order.setSupplier(supplier);
        order.setNumber(trim(dto.number()));
        order.setIssueDate(dto.issueDate());
        order.setExpectedDeliveryDate(dto.expectedDeliveryDate());
        order.setNotes(trim(dto.notes()));
        order.getItems().clear();

        BigDecimal total = BigDecimal.ZERO;
        if (dto.items() != null) {
            for (PurchaseItemDTO itemDTO : dto.items()) {
                PurchaseOrderItem item = new PurchaseOrderItem();
                item.setId(itemDTO.id() == null ? UUID.randomUUID() : itemDTO.id());
                item.setOrder(order);
                item.setStockItemId(itemDTO.stockItemId());
                item.setDescription(trim(itemDTO.description()));
                item.setCategory(trim(itemDTO.category()));
                item.setQuantity(itemDTO.quantity());
                item.setUnitValue(money(itemDTO.unitValue()));
                item.setTotalValue(itemDTO.quantity().multiply(money(itemDTO.unitValue())).setScale(2, RoundingMode.HALF_UP));
                item.setReceivedQuantity(BigDecimal.ZERO);
                total = total.add(item.getTotalValue());
                order.getItems().add(item);
            }
        }
        order.setTotalEstimatedValue(total);
    }

    private PurchaseOrderStatus resolveReceiptStatus(PurchaseOrder order) {
        BigDecimal totalQuantity = order.getItems().stream()
                .map(PurchaseOrderItem::getQuantity)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalReceived = order.getItems().stream()
                .map(PurchaseOrderItem::getReceivedQuantity)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalQuantity.compareTo(BigDecimal.ZERO) == 0 || totalReceived.compareTo(BigDecimal.ZERO) == 0) {
            return PurchaseOrderStatus.OPEN;
        }
        return totalReceived.compareTo(totalQuantity) >= 0
                ? PurchaseOrderStatus.RECEIVED
                : PurchaseOrderStatus.PARTIALLY_RECEIVED;
    }

    private PurchaseRequest getRequestEntity(UUID id) {
        return requestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Solicitação de compra não encontrada"));
    }

    private PurchaseOrder getOrderEntity(UUID id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido de compra não encontrado"));
    }

    private BigDecimal money(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal quantity(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(3, RoundingMode.HALF_UP);
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
