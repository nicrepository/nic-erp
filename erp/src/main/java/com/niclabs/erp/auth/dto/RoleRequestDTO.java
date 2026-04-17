package com.niclabs.erp.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record RoleRequestDTO(
        @NotBlank(message = "O nome do cargo é obrigatório.")
        @Size(max = 50, message = "O nome do cargo deve ter no máximo 50 caracteres.")
        String name,

        List<String> permissions
) {}
