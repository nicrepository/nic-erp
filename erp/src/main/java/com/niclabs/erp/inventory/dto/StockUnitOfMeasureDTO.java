package com.niclabs.erp.inventory.dto;

import jakarta.validation.constraints.NotBlank;

public record StockUnitOfMeasureDTO(
        @NotBlank(message = "O nome da unidade de medida é obrigatório.")
        String name,
        Boolean active
) {
}
