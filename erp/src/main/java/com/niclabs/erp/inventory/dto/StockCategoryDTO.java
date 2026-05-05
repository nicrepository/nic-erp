package com.niclabs.erp.inventory.dto;

import jakarta.validation.constraints.NotBlank;

public record StockCategoryDTO(
        @NotBlank(message = "O nome da categoria é obrigatório.")
        String name,
        Boolean active
) {
}
