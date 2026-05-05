package com.niclabs.erp.fiscal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SupplierRequestDTO(
        @NotBlank(message = "A razão social é obrigatória.")
        String legalName,
        String tradeName,
        @NotBlank(message = "O CNPJ/CPF é obrigatório.")
        @Size(max = 20, message = "O documento deve ter no máximo 20 caracteres.")
        String document,
        String stateRegistration,
        String municipalRegistration,
        String fiscalEmail,
        String phone,
        String contactName,
        String category,
        String street,
        String number,
        String complement,
        String district,
        String city,
        String state,
        String zipCode,
        String notes,
        Boolean active
) {
}
