package com.niclabs.erp.auth.dto;

public record ChangePasswordDTO(
        String currentPassword,
        String newPassword
) {}