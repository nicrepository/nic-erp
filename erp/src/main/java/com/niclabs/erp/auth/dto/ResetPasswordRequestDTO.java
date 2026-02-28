package com.niclabs.erp.auth.dto;

public record ResetPasswordRequestDTO(
        String token,
        String newPassword
) {
}
