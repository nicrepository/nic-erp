package com.niclabs.erp.inventory.dto;

import jakarta.validation.constraints.NotBlank;

public record ITAssetDTO(
        @NotBlank(message = "O número de série é obrigatório.")
        String serialNumber,

        @NotBlank(message = "A tag de patrimônio é obrigatória.")
        String assetTag,

        @NotBlank(message = "O modelo é obrigatório.")
        String model,

        @NotBlank(message = "A marca é obrigatória.")
        String brand,

        String details
) {
}
