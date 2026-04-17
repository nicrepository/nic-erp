package com.niclabs.erp.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequestDTO(
        @NotBlank(message = "O token é obrigatório.")
        String token,

        @NotBlank(message = "A nova senha é obrigatória.")
        @Size(min = 8, message = "A senha deve ter no mínimo 8 caracteres.")
        String newPassword
) {
}
