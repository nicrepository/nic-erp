package com.niclabs.erp.fiscal.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record FiscalInvoiceItemDTO(
        UUID id,
        UUID stockItemId,
        @NotBlank(message = "A descrição do item é obrigatória.")
        String description,
        String category,
        @NotNull(message = "A quantidade é obrigatória.")
        @DecimalMin(value = "0.001", message = "A quantidade deve ser maior que zero.")
        BigDecimal quantity,
        @NotNull(message = "O valor unitário é obrigatório.")
        @DecimalMin(value = "0.00", message = "O valor unitário não pode ser negativo.")
        BigDecimal unitValue,
        String ncm,
        String cfop,
        boolean entersStock,
        boolean patrimony
) {
}
