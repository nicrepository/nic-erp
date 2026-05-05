package com.niclabs.erp.purchasing.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record PurchaseReceiptItemDTO(
        @NotNull(message = "O item do pedido é obrigatório.")
        UUID orderItemId,
        @NotNull(message = "A quantidade recebida é obrigatória.")
        @DecimalMin(value = "0.001", message = "A quantidade recebida deve ser maior que zero.")
        BigDecimal receivedQuantity
) {
}
