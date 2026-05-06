package com.niclabs.erp.inventory.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record StockItemDTO(
        @NotBlank(message = "O nome do item é obrigatório.")
        String name,

        @NotBlank(message = "A categoria é obrigatória.")
        String category,

        @NotNull(message = "O estoque mínimo é obrigatório.")
        @Min(value = 0, message = "O estoque mínimo não pode ser negativo.")
        Integer minimumStock,

        @NotNull(message = "O valor do item é obrigatório.")
        @Min(value = 0, message = "O valor do item não pode ser negativo.")
        BigDecimal unitValue,

        String unitOfMeasure,

        String notes
) {
}
