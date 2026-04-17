package com.niclabs.erp.exception;

import java.time.LocalDateTime;
import java.util.List;

public record ErrorResponseDTO(
        LocalDateTime timestamp,
        int status,
        String error,
        String message,
        String path,
        List<FieldErrorDTO> fieldErrors
) {
    public record FieldErrorDTO(String field, String message) {}

    public static ErrorResponseDTO of(int status, String error, String message, String path) {
        return new ErrorResponseDTO(LocalDateTime.now(), status, error, message, path, null);
    }

    public static ErrorResponseDTO ofValidation(int status, String path, List<FieldErrorDTO> fieldErrors) {
        return new ErrorResponseDTO(LocalDateTime.now(), status, "Erro de Validação",
                "Um ou mais campos possuem valores inválidos.", path, fieldErrors);
    }
}
