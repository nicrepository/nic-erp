package com.niclabs.erp.inventory.dto;

import com.niclabs.erp.inventory.domain.AssetAction;

import java.time.LocalDateTime;
import java.util.UUID;

public record ITAssetHistoryResponseDTO(
        UUID id,
        UUID assetId,
        AssetAction action,
        UUID performedBy,
        UUID assignedToUser,
        LocalDateTime createdAt
) {}
