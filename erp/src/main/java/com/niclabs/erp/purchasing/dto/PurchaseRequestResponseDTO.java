package com.niclabs.erp.purchasing.dto;

import com.niclabs.erp.purchasing.domain.PurchaseRequest;
import com.niclabs.erp.purchasing.domain.PurchaseRequestItem;
import com.niclabs.erp.purchasing.domain.PurchaseRequestStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record PurchaseRequestResponseDTO(
        UUID id,
        String title,
        String justification,
        String costCenter,
        PurchaseRequestStatus status,
        UUID requestedBy,
        UUID approvedBy,
        LocalDateTime approvedAt,
        String rejectionReason,
        BigDecimal estimatedTotalValue,
        List<PurchaseItemResponseDTO> items
) {
    public static PurchaseRequestResponseDTO fromEntity(PurchaseRequest request) {
        BigDecimal total = request.getItems().stream()
                .map(PurchaseRequestItem::getEstimatedTotalValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new PurchaseRequestResponseDTO(
                request.getId(),
                request.getTitle(),
                request.getJustification(),
                request.getCostCenter(),
                request.getStatus(),
                request.getRequestedBy(),
                request.getApprovedBy(),
                request.getApprovedAt(),
                request.getRejectionReason(),
                total,
                request.getItems().stream().map(PurchaseItemResponseDTO::fromRequestItem).toList()
        );
    }
}
