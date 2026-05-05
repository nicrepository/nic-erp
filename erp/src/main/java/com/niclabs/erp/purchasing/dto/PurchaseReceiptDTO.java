package com.niclabs.erp.purchasing.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record PurchaseReceiptDTO(
        @NotEmpty(message = "Informe ao menos um item recebido.")
        @Valid
        List<PurchaseReceiptItemDTO> items
) {
}
