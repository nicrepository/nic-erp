package com.niclabs.erp.purchasing.dto;

import com.niclabs.erp.purchasing.domain.PurchaseOrderItem;
import com.niclabs.erp.purchasing.domain.PurchaseRequestItem;

import java.math.BigDecimal;
import java.util.UUID;

public record PurchaseItemResponseDTO(
        UUID id,
        UUID stockItemId,
        String description,
        String category,
        BigDecimal quantity,
        BigDecimal unitValue,
        BigDecimal totalValue,
        BigDecimal receivedQuantity,
        BigDecimal pendingQuantity
) {
    public static PurchaseItemResponseDTO fromRequestItem(PurchaseRequestItem item) {
        return new PurchaseItemResponseDTO(
                item.getId(),
                item.getStockItemId(),
                item.getDescription(),
                item.getCategory(),
                item.getQuantity(),
                item.getEstimatedUnitValue(),
                item.getEstimatedTotalValue(),
                BigDecimal.ZERO,
                item.getQuantity()
        );
    }

    public static PurchaseItemResponseDTO fromOrderItem(PurchaseOrderItem item) {
        return new PurchaseItemResponseDTO(
                item.getId(),
                item.getStockItemId(),
                item.getDescription(),
                item.getCategory(),
                item.getQuantity(),
                item.getUnitValue(),
                item.getTotalValue(),
                item.getReceivedQuantity(),
                item.getQuantity().subtract(item.getReceivedQuantity())
        );
    }
}
