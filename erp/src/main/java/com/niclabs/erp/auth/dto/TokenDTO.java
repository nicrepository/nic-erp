package com.niclabs.erp.auth.dto;

/**
 * Login response payload.
 *
 * @param token              signed JWT for subsequent requests
 * @param mustChangePassword {@code true} when the user must set a new password before continuing
 */
public record TokenDTO(String token, boolean mustChangePassword) {}
