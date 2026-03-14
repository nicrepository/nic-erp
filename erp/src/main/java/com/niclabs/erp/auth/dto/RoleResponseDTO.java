package com.niclabs.erp.auth.dto;

import java.util.List;
import java.util.UUID;

// Usado para o Spring DEVOLVER os Cargos e suas Permissões para o React
public record RoleResponseDTO(
        UUID id,
        String name,
        List<String> permissions
) {}