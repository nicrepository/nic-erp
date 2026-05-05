package com.niclabs.erp.purchasing.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record PurchaseRequestDTO(
        @NotBlank(message = "O título é obrigatório.")
        String title,
        String justification,
        String costCenter,
        @Valid
        List<PurchaseItemDTO> items
) {
}
