package com.niclabs.erp.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Payload for the first-login mandatory password change.
 *
 * <p>No current password is required: the caller's identity is already proved
 * by the valid JWT attached to the request.</p>
 *
 * @param newPassword the user's chosen password (minimum 8 characters)
 */
public record FirstLoginPasswordDTO(
        @NotBlank(message = "A nova senha não pode estar vazia.")
        @Size(min = 8, message = "A senha deve ter pelo menos 8 caracteres.")
        String newPassword
) {}
