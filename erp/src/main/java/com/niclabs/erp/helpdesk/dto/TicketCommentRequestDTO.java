package com.niclabs.erp.helpdesk.dto;

import jakarta.validation.constraints.NotBlank;

public record TicketCommentRequestDTO(
        @NotBlank(message = "O conteúdo do comentário é obrigatório.")
        String content
) {
}
