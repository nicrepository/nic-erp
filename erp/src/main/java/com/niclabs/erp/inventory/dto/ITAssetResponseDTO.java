package com.niclabs.erp.inventory.dto;

import com.niclabs.erp.inventory.domain.AssetStatus;

import java.util.UUID;

public record ITAssetResponseDTO(
        UUID id,
        String serialNumber,
        String assetTag,
        String model,
        String brand,
        String details,
        AssetStatus status,
        UUID assignedTo
) {}
