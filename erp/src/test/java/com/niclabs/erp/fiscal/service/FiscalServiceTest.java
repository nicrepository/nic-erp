package com.niclabs.erp.fiscal.service;

import com.niclabs.erp.auth.domain.User;
import com.niclabs.erp.exception.BusinessException;
import com.niclabs.erp.exception.ResourceNotFoundException;
import com.niclabs.erp.fiscal.domain.FiscalInvoice;
import com.niclabs.erp.fiscal.domain.FiscalInvoiceItem;
import com.niclabs.erp.fiscal.domain.FiscalInvoiceStatus;
import com.niclabs.erp.fiscal.domain.FiscalInvoiceType;
import com.niclabs.erp.fiscal.domain.Supplier;
import com.niclabs.erp.fiscal.dto.FiscalInvoiceItemDTO;
import com.niclabs.erp.fiscal.dto.FiscalInvoiceRequestDTO;
import com.niclabs.erp.fiscal.dto.SupplierRequestDTO;
import com.niclabs.erp.fiscal.repository.FiscalInvoiceRepository;
import com.niclabs.erp.fiscal.repository.SupplierRepository;
import com.niclabs.erp.inventory.service.IStockItemService;
import com.niclabs.erp.purchasing.domain.PurchaseOrder;
import com.niclabs.erp.purchasing.domain.PurchaseOrderItem;
import com.niclabs.erp.purchasing.repository.PurchaseOrderRepository;
import com.niclabs.erp.storage.service.IStorageService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FiscalServiceTest {

    @Mock SupplierRepository supplierRepository;
    @Mock FiscalInvoiceRepository invoiceRepository;
    @Mock IStorageService storageService;
    @Mock IStockItemService stockItemService;
    @Mock PurchaseOrderRepository purchaseOrderRepository;

    @InjectMocks FiscalService fiscalService;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createSupplier_shouldNormalizeDocumentAndRejectDuplicate() {
        SupplierRequestDTO dto = supplierDto("12.345.678/0001-90");
        when(supplierRepository.findByDocument("12345678000190")).thenReturn(Optional.of(new Supplier()));

        assertThatThrownBy(() -> fiscalService.createSupplier(dto))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("fornecedor");

        verify(supplierRepository, never()).save(any());
    }

    @Test
    void createInvoice_shouldPersistReceivedInvoice() {
        UUID supplierId = UUID.randomUUID();
        Supplier supplier = supplier(supplierId);
        mockCurrentUser();
        when(supplierRepository.findById(supplierId)).thenReturn(Optional.of(supplier));
        when(invoiceRepository.findBySupplierIdAndNumberAndSeries(supplierId, "123", "1")).thenReturn(Optional.empty());
        when(invoiceRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var response = fiscalService.createInvoice(invoiceDto(supplierId, FiscalInvoiceStatus.RECEIVED));

        assertThat(response.status()).isEqualTo(FiscalInvoiceStatus.RECEIVED);
        assertThat(response.items()).hasSize(1);
        assertThat(response.items().get(0).totalValue()).isEqualByComparingTo("25.00");
    }

    @Test
    void launchInvoice_shouldRequireValidatedStatus() {
        FiscalInvoice invoice = invoice(FiscalInvoiceStatus.RECEIVED);
        when(invoiceRepository.findById(invoice.getId())).thenReturn(Optional.of(invoice));

        assertThatThrownBy(() -> fiscalService.launchInvoice(invoice.getId()))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("validada");
    }

    @Test
    void launchInvoice_shouldMoveLinkedItemsToStock() {
        FiscalInvoice invoice = invoice(FiscalInvoiceStatus.VALIDATED);
        UUID stockItemId = UUID.randomUUID();
        invoice.getItems().add(invoiceItem(invoice, stockItemId, new BigDecimal("3"), new BigDecimal("8.50")));

        mockCurrentUser();
        when(invoiceRepository.findById(invoice.getId())).thenReturn(Optional.of(invoice));
        when(invoiceRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var response = fiscalService.launchInvoice(invoice.getId());

        assertThat(response.status()).isEqualTo(FiscalInvoiceStatus.LAUNCHED);
        verify(stockItemService).addStockFromFiscal(stockItemId, 3, new BigDecimal("8.50"), invoice.getId(), "NF 123");
    }

    @Test
    void getInvoice_shouldReturnMatchedReconciliation_whenOrderReceiptAndInvoiceMatch() {
        UUID stockItemId = UUID.randomUUID();
        Supplier supplier = supplier(UUID.randomUUID());
        PurchaseOrder order = purchaseOrder(supplier, stockItemId, new BigDecimal("3.000"), new BigDecimal("3.000"), new BigDecimal("8.50"));
        FiscalInvoice invoice = invoice(FiscalInvoiceStatus.VALIDATED);
        invoice.setSupplier(supplier);
        invoice.setPurchaseOrder(order);
        invoice.setTotalValue(new BigDecimal("25.50"));
        invoice.getItems().add(invoiceItem(invoice, stockItemId, new BigDecimal("3.000"), new BigDecimal("8.50")));
        when(invoiceRepository.findById(invoice.getId())).thenReturn(Optional.of(invoice));

        var response = fiscalService.getInvoice(invoice.getId());

        assertThat(response.reconciliation().status().name()).isEqualTo("MATCHED");
        assertThat(response.reconciliation().divergenceCount()).isZero();
    }

    @Test
    void launchInvoice_shouldBlock_whenLinkedOrderHasReconciliationDivergence() {
        UUID stockItemId = UUID.randomUUID();
        Supplier supplier = supplier(UUID.randomUUID());
        PurchaseOrder order = purchaseOrder(supplier, stockItemId, new BigDecimal("3.000"), new BigDecimal("1.000"), new BigDecimal("8.50"));
        FiscalInvoice invoice = invoice(FiscalInvoiceStatus.VALIDATED);
        invoice.setSupplier(supplier);
        invoice.setPurchaseOrder(order);
        invoice.setTotalValue(new BigDecimal("25.50"));
        invoice.getItems().add(invoiceItem(invoice, stockItemId, new BigDecimal("3.000"), new BigDecimal("8.50")));
        when(invoiceRepository.findById(invoice.getId())).thenReturn(Optional.of(invoice));

        assertThatThrownBy(() -> fiscalService.launchInvoice(invoice.getId()))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("conciliação");

        verify(stockItemService, never()).addStockFromFiscal(any(), any(Integer.class), any(), any(), any());
    }

    @Test
    void getInvoice_shouldThrow_whenMissing() {
        UUID id = UUID.randomUUID();
        when(invoiceRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> fiscalService.getInvoice(id))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    private SupplierRequestDTO supplierDto(String document) {
        return new SupplierRequestDTO(
                "Fornecedor LTDA", "Fornecedor", document, null, null,
                "fiscal@email.com", null, null, "Materiais", null, null,
                null, null, null, null, null, null, true
        );
    }

    private Supplier supplier(UUID id) {
        Supplier supplier = new Supplier();
        supplier.setId(id);
        supplier.setLegalName("Fornecedor LTDA");
        supplier.setDocument("12345678000190");
        supplier.setActive(true);
        return supplier;
    }

    private FiscalInvoiceRequestDTO invoiceDto(UUID supplierId, FiscalInvoiceStatus status) {
        return new FiscalInvoiceRequestDTO(
                supplierId,
                null,
                "123",
                "1",
                "35260000000000000000000000000000000000000000",
                FiscalInvoiceType.CONSUMABLE,
                status,
                LocalDate.of(2026, 5, 5),
                LocalDate.of(2026, 5, 5),
                new BigDecimal("25.00"),
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                null,
                "ADM",
                null,
                null,
                null,
                List.of(new FiscalInvoiceItemDTO(null, null, "Papel A4", "Papelaria", new BigDecimal("2"), new BigDecimal("12.50"), null, null, false, false))
        );
    }

    private FiscalInvoice invoice(FiscalInvoiceStatus status) {
        FiscalInvoice invoice = new FiscalInvoice();
        invoice.setId(UUID.randomUUID());
        invoice.setSupplier(supplier(UUID.randomUUID()));
        invoice.setNumber("123");
        invoice.setSeries("1");
        invoice.setInvoiceType(FiscalInvoiceType.CONSUMABLE);
        invoice.setStatus(status);
        invoice.setIssueDate(LocalDate.of(2026, 5, 5));
        invoice.setProductValue(BigDecimal.ZERO);
        invoice.setFreightValue(BigDecimal.ZERO);
        invoice.setDiscountValue(BigDecimal.ZERO);
        invoice.setTaxValue(BigDecimal.ZERO);
        invoice.setTotalValue(BigDecimal.ZERO);
        return invoice;
    }

    private FiscalInvoiceItem invoiceItem(FiscalInvoice invoice, UUID stockItemId, BigDecimal quantity, BigDecimal unitValue) {
        FiscalInvoiceItem item = new FiscalInvoiceItem();
        item.setId(UUID.randomUUID());
        item.setInvoice(invoice);
        item.setStockItemId(stockItemId);
        item.setDescription("Papel A4");
        item.setQuantity(quantity);
        item.setUnitValue(unitValue);
        item.setTotalValue(quantity.multiply(unitValue));
        item.setEntersStock(true);
        return item;
    }

    private PurchaseOrder purchaseOrder(Supplier supplier, UUID stockItemId, BigDecimal quantity, BigDecimal receivedQuantity, BigDecimal unitValue) {
        PurchaseOrder order = new PurchaseOrder();
        order.setId(UUID.randomUUID());
        order.setSupplier(supplier);
        order.setNumber("PC-001");
        order.setIssueDate(LocalDate.of(2026, 5, 5));
        order.setTotalEstimatedValue(quantity.multiply(unitValue).setScale(2));

        PurchaseOrderItem item = new PurchaseOrderItem();
        item.setId(UUID.randomUUID());
        item.setOrder(order);
        item.setStockItemId(stockItemId);
        item.setDescription("Papel A4");
        item.setCategory("Papelaria");
        item.setQuantity(quantity);
        item.setReceivedQuantity(receivedQuantity);
        item.setUnitValue(unitValue);
        item.setTotalValue(quantity.multiply(unitValue).setScale(2));
        order.getItems().add(item);

        return order;
    }

    private void mockCurrentUser() {
        User user = new User();
        user.setId(UUID.randomUUID());
        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(user);
        SecurityContext ctx = mock(SecurityContext.class);
        when(ctx.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(ctx);
    }
}
