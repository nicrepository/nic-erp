package com.niclabs.erp.inventory.dto;

import com.niclabs.erp.inventory.domain.StockUnitOfMeasure;

import java.util.UUID;

public record StockUnitOfMeasureResponseDTO(
        UUID id,
        String name,
        boolean active
) {
    public static StockUnitOfMeasureResponseDTO fromEntity(StockUnitOfMeasure unit) {
        return new StockUnitOfMeasureResponseDTO(
                unit.getId(),
                unit.getName(),
                unit.isActive()
        );
    }
}
