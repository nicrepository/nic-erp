package com.niclabs.erp.purchasing.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record PurchaseOrderDTO(
        UUID requestId,
        @NotNull(message = "O fornecedor é obrigatório.")
        UUID supplierId,
        @NotBlank(message = "O número do pedido é obrigatório.")
        String number,
        @NotNull(message = "A data do pedido é obrigatória.")
        LocalDate issueDate,
        LocalDate expectedDeliveryDate,
        String notes,
        @Valid
        List<PurchaseItemDTO> items
) {
}
