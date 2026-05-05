package com.niclabs.erp.inventory.dto;

import com.niclabs.erp.inventory.domain.StockCategory;

import java.util.UUID;

public record StockCategoryResponseDTO(
        UUID id,
        String name,
        boolean active
) {
    public static StockCategoryResponseDTO fromEntity(StockCategory category) {
        return new StockCategoryResponseDTO(
                category.getId(),
                category.getName(),
                category.isActive()
        );
    }
}
