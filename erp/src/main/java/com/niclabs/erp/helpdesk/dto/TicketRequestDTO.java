package com.niclabs.erp.helpdesk.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record TicketRequestDTO(
        @NotBlank(message = "O título do chamado é obrigatório.")
        @Size(max = 200, message = "O título deve ter no máximo 200 caracteres.")
        String title,

        @NotBlank(message = "A descrição do chamado é obrigatória.")
        String description,

        @NotNull(message = "A categoria é obrigatória.")
        UUID categoryId
) {
}
