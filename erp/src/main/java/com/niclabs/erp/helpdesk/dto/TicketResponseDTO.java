package com.niclabs.erp.helpdesk.dto;

import com.niclabs.erp.helpdesk.domain.Ticket;
import com.niclabs.erp.helpdesk.domain.TicketCategory;
import com.niclabs.erp.helpdesk.domain.TicketDepartment;
import com.niclabs.erp.helpdesk.domain.TicketPriority;
import com.niclabs.erp.helpdesk.domain.TicketStatus;

import java.util.UUID;

public record TicketResponseDTO(
        UUID id,
        String title,
        String description,
        TicketPriority priority,
        TicketDepartment department,
        TicketStatus status,
        UUID requesterId,
        UUID assigneeId,
        java.util.List<String> attachments,
        UUID categoryId,
        String categoryName,
        String categoryDescription
) {
    public static TicketResponseDTO fromEntity(Ticket ticket, TicketCategory category) {
        return new TicketResponseDTO(
                ticket.getId(),
                ticket.getTitle(),
                ticket.getDescription(),
                ticket.getPriority(),
                ticket.getDepartment(),
                ticket.getStatus(),
                ticket.getRequesterId(),
                ticket.getAssigneeId(),
                ticket.getAttachments(),
                category != null ? category.getId() : ticket.getCategoryId(),
                category != null ? category.getName() : null,
                category != null ? category.getDescription() : null
        );
    }

    public static TicketResponseDTO fromEntity(Ticket ticket) {
        return fromEntity(ticket, null);
    }
}

