package com.niclabs.erp.inventory.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record StockItemDTO(
        @NotBlank(message = "O nome do item é obrigatório.")
        String name,

        @NotBlank(message = "A categoria é obrigatória.")
        String category,

        @NotNull(message = "O estoque mínimo é obrigatório.")
        @Min(value = 0, message = "O estoque mínimo não pode ser negativo.")
        Integer minimumStock
) {
}
