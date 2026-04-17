package com.niclabs.erp.helpdesk.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record TicketCommentResponseDTO(
        UUID id,
        UUID ticketId,
        UUID authorId,
        String content,
        LocalDateTime createdAt
) {}
