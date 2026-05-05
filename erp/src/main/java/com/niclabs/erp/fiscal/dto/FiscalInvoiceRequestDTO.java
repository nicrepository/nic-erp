package com.niclabs.erp.fiscal.dto;

import com.niclabs.erp.fiscal.domain.FiscalInvoiceStatus;
import com.niclabs.erp.fiscal.domain.FiscalInvoiceType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record FiscalInvoiceRequestDTO(
        @NotNull(message = "O fornecedor é obrigatório.")
        UUID supplierId,
        UUID purchaseOrderId,
        @NotBlank(message = "O número da nota é obrigatório.")
        String number,
        String series,
        String accessKey,
        @NotNull(message = "O tipo da nota é obrigatório.")
        FiscalInvoiceType invoiceType,
        FiscalInvoiceStatus status,
        @NotNull(message = "A data de emissão é obrigatória.")
        LocalDate issueDate,
        LocalDate receivedDate,
        @DecimalMin(value = "0.00", message = "O valor dos produtos não pode ser negativo.")
        BigDecimal productValue,
        @DecimalMin(value = "0.00", message = "O frete não pode ser negativo.")
        BigDecimal freightValue,
        @DecimalMin(value = "0.00", message = "O desconto não pode ser negativo.")
        BigDecimal discountValue,
        @DecimalMin(value = "0.00", message = "O imposto não pode ser negativo.")
        BigDecimal taxValue,
        BigDecimal totalValue,
        String costCenter,
        String purchaseOrderReference,
        String notes,
        String divergenceNotes,
        @Valid
        List<FiscalInvoiceItemDTO> items
) {
}
