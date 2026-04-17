package com.niclabs.erp.inventory.dto;

import com.niclabs.erp.inventory.domain.MovementType;

import java.time.LocalDateTime;
import java.util.UUID;

public record StockMovementResponseDTO(
        UUID id,
        UUID itemId,
        MovementType type,
        Integer quantity,
        UUID performedBy,
        LocalDateTime createdAt
) {}
