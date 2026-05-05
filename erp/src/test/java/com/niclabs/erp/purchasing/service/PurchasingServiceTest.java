package com.niclabs.erp.purchasing.service;

import com.niclabs.erp.auth.domain.User;
import com.niclabs.erp.exception.BusinessException;
import com.niclabs.erp.fiscal.domain.Supplier;
import com.niclabs.erp.fiscal.repository.SupplierRepository;
import com.niclabs.erp.purchasing.domain.PurchaseOrder;
import com.niclabs.erp.purchasing.domain.PurchaseOrderItem;
import com.niclabs.erp.purchasing.domain.PurchaseOrderStatus;
import com.niclabs.erp.purchasing.domain.PurchaseRequest;
import com.niclabs.erp.purchasing.domain.PurchaseRequestStatus;
import com.niclabs.erp.purchasing.dto.PurchaseItemDTO;
import com.niclabs.erp.purchasing.dto.PurchaseOrderDTO;
import com.niclabs.erp.purchasing.dto.PurchaseReceiptDTO;
import com.niclabs.erp.purchasing.dto.PurchaseReceiptItemDTO;
import com.niclabs.erp.purchasing.dto.PurchaseRequestDTO;
import com.niclabs.erp.purchasing.repository.PurchaseOrderRepository;
import com.niclabs.erp.purchasing.repository.PurchaseRequestRepository;
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
class PurchasingServiceTest {

    @Mock PurchaseRequestRepository requestRepository;
    @Mock PurchaseOrderRepository orderRepository;
    @Mock SupplierRepository supplierRepository;

    @InjectMocks PurchasingService purchasingService;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createRequest_shouldPersistDraftWithEstimatedTotal() {
        mockCurrentUser();
        when(requestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var response = purchasingService.createRequest(requestDto());

        assertThat(response.status()).isEqualTo(PurchaseRequestStatus.DRAFT);
        assertThat(response.estimatedTotalValue()).isEqualByComparingTo("150.00");
        assertThat(response.items()).hasSize(1);
    }

    @Test
    void approveRequest_shouldRequireSubmittedStatus() {
        PurchaseRequest request = request(PurchaseRequestStatus.DRAFT);
        when(requestRepository.findById(request.getId())).thenReturn(Optional.of(request));

        assertThatThrownBy(() -> purchasingService.updateRequestStatus(request.getId(), PurchaseRequestStatus.APPROVED, null))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("enviadas");
    }

    @Test
    void createOrder_shouldRequireApprovedRequest() {
        UUID requestId = UUID.randomUUID();
        UUID supplierId = UUID.randomUUID();
        when(orderRepository.findByNumber("PC-001")).thenReturn(Optional.empty());
        when(supplierRepository.findById(supplierId)).thenReturn(Optional.of(supplier(supplierId)));
        when(requestRepository.findById(requestId)).thenReturn(Optional.of(request(PurchaseRequestStatus.SUBMITTED, requestId)));
        mockCurrentUser();

        assertThatThrownBy(() -> purchasingService.createOrder(orderDto(requestId, supplierId)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("aprovada");

        verify(orderRepository, never()).save(any());
    }

    @Test
    void createOrder_shouldMarkRequestOrderedAndCalculateTotal() {
        UUID requestId = UUID.randomUUID();
        UUID supplierId = UUID.randomUUID();
        PurchaseRequest request = request(PurchaseRequestStatus.APPROVED, requestId);
        when(orderRepository.findByNumber("PC-001")).thenReturn(Optional.empty());
        when(supplierRepository.findById(supplierId)).thenReturn(Optional.of(supplier(supplierId)));
        when(requestRepository.findById(requestId)).thenReturn(Optional.of(request));
        when(orderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        mockCurrentUser();

        var response = purchasingService.createOrder(orderDto(requestId, supplierId));

        assertThat(response.status()).isEqualTo(PurchaseOrderStatus.OPEN);
        assertThat(response.totalEstimatedValue()).isEqualByComparingTo("150.00");
        assertThat(request.getStatus()).isEqualTo(PurchaseRequestStatus.ORDERED);
    }

    @Test
    void receiveOrder_shouldMarkAsPartiallyReceived() {
        PurchaseOrder order = order(PurchaseOrderStatus.SENT_TO_SUPPLIER, new BigDecimal("5.000"), BigDecimal.ZERO);
        PurchaseOrderItem item = order.getItems().get(0);
        when(orderRepository.findById(order.getId())).thenReturn(Optional.of(order));
        when(orderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var response = purchasingService.receiveOrder(order.getId(), receiptDto(item.getId(), new BigDecimal("2.000")));

        assertThat(response.status()).isEqualTo(PurchaseOrderStatus.PARTIALLY_RECEIVED);
        assertThat(response.items().get(0).receivedQuantity()).isEqualByComparingTo("2.000");
        assertThat(response.items().get(0).pendingQuantity()).isEqualByComparingTo("3.000");
    }

    @Test
    void receiveOrder_shouldRejectQuantityAbovePending() {
        PurchaseOrder order = order(PurchaseOrderStatus.PARTIALLY_RECEIVED, new BigDecimal("5.000"), new BigDecimal("4.000"));
        PurchaseOrderItem item = order.getItems().get(0);
        when(orderRepository.findById(order.getId())).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> purchasingService.receiveOrder(order.getId(), receiptDto(item.getId(), new BigDecimal("2.000"))))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("saldo pendente");

        verify(orderRepository, never()).save(any());
    }

    private PurchaseRequestDTO requestDto() {
        return new PurchaseRequestDTO(
                "Reposição de estoque",
                "Materiais de expediente",
                "ADM",
                List.of(itemDto())
        );
    }

    private PurchaseOrderDTO orderDto(UUID requestId, UUID supplierId) {
        return new PurchaseOrderDTO(
                requestId,
                supplierId,
                "PC-001",
                LocalDate.of(2026, 5, 5),
                LocalDate.of(2026, 5, 12),
                "Compra mensal",
                List.of(itemDto())
        );
    }

    private PurchaseItemDTO itemDto() {
        return new PurchaseItemDTO(null, null, "Papel A4", "Papelaria", new BigDecimal("3"), new BigDecimal("50.00"));
    }

    private PurchaseReceiptDTO receiptDto(UUID itemId, BigDecimal quantity) {
        return new PurchaseReceiptDTO(List.of(new PurchaseReceiptItemDTO(itemId, quantity)));
    }

    private PurchaseOrder order(PurchaseOrderStatus status, BigDecimal quantity, BigDecimal receivedQuantity) {
        PurchaseOrder order = new PurchaseOrder();
        order.setId(UUID.randomUUID());
        order.setSupplier(supplier(UUID.randomUUID()));
        order.setNumber("PC-001");
        order.setStatus(status);
        order.setIssueDate(LocalDate.of(2026, 5, 5));
        order.setTotalEstimatedValue(new BigDecimal("250.00"));

        PurchaseOrderItem item = new PurchaseOrderItem();
        item.setId(UUID.randomUUID());
        item.setOrder(order);
        item.setDescription("Papel A4");
        item.setCategory("Papelaria");
        item.setQuantity(quantity);
        item.setUnitValue(new BigDecimal("50.00"));
        item.setTotalValue(new BigDecimal("250.00"));
        item.setReceivedQuantity(receivedQuantity);
        order.getItems().add(item);

        return order;
    }

    private PurchaseRequest request(PurchaseRequestStatus status) {
        return request(status, UUID.randomUUID());
    }

    private PurchaseRequest request(PurchaseRequestStatus status, UUID id) {
        PurchaseRequest request = new PurchaseRequest();
        request.setId(id);
        request.setTitle("Reposição de estoque");
        request.setStatus(status);
        return request;
    }

    private Supplier supplier(UUID id) {
        Supplier supplier = new Supplier();
        supplier.setId(id);
        supplier.setLegalName("Fornecedor LTDA");
        supplier.setDocument("12345678000190");
        supplier.setActive(true);
        return supplier;
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
