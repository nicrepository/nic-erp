package com.niclabs.erp.fiscal.dto;

import com.niclabs.erp.fiscal.domain.Supplier;

import java.util.UUID;

public record SupplierResponseDTO(
        UUID id,
        String legalName,
        String tradeName,
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
        boolean active
) {
    public static SupplierResponseDTO fromEntity(Supplier s) {
        return new SupplierResponseDTO(
                s.getId(),
                s.getLegalName(),
                s.getTradeName(),
                s.getDocument(),
                s.getStateRegistration(),
                s.getMunicipalRegistration(),
                s.getFiscalEmail(),
                s.getPhone(),
                s.getContactName(),
                s.getCategory(),
                s.getStreet(),
                s.getNumber(),
                s.getComplement(),
                s.getDistrict(),
                s.getCity(),
                s.getState(),
                s.getZipCode(),
                s.getNotes(),
                s.isActive()
        );
    }
}
