package com.niclabs.erp.announcement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AnnouncementRequestDTO(
        @NotBlank(message = "O título é obrigatório.")
        @Size(max = 200, message = "O título deve ter no máximo 200 caracteres.")
        String title,

        @NotBlank(message = "O conteúdo é obrigatório.")
        String content
) {
}
