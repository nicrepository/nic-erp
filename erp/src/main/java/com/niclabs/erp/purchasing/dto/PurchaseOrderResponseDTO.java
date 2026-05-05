package com.niclabs.erp.purchasing.dto;

import com.niclabs.erp.fiscal.dto.SupplierResponseDTO;
import com.niclabs.erp.purchasing.domain.PurchaseOrder;
import com.niclabs.erp.purchasing.domain.PurchaseOrderStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record PurchaseOrderResponseDTO(
        UUID id,
        UUID requestId,
        SupplierResponseDTO supplier,
        String number,
        PurchaseOrderStatus status,
        LocalDate issueDate,
        LocalDate expectedDeliveryDate,
        BigDecimal totalEstimatedValue,
        String notes,
        UUID createdBy,
        List<PurchaseItemResponseDTO> items
) {
    public static PurchaseOrderResponseDTO fromEntity(PurchaseOrder order) {
        return new PurchaseOrderResponseDTO(
                order.getId(),
                order.getRequest() == null ? null : order.getRequest().getId(),
                SupplierResponseDTO.fromEntity(order.getSupplier()),
                order.getNumber(),
                order.getStatus(),
                order.getIssueDate(),
                order.getExpectedDeliveryDate(),
                order.getTotalEstimatedValue(),
                order.getNotes(),
                order.getCreatedBy(),
                order.getItems().stream().map(PurchaseItemResponseDTO::fromOrderItem).toList()
        );
    }
}
