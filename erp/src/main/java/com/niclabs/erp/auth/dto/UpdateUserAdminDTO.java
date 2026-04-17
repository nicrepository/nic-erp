package com.niclabs.erp.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record UpdateUserAdminDTO(
        @NotBlank(message = "O nome é obrigatório.")
        String name,

        @NotBlank(message = "O e-mail é obrigatório.")
        @Email(message = "Formato de e-mail inválido.")
        String email
) {}
