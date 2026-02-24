package com.niclabs.erp.auth.dto;

import java.util.List;
import java.util.UUID;

public record UserResponseDTO(
        UUID id,
        String name,
        String email,
        List<String> roles // Devolvemos apenas os nomes (ex: ["ROLE_ADMIN"])
) {
}