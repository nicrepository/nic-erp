package com.niclabs.erp.helpdesk.dto;

import com.niclabs.erp.helpdesk.domain.Ticket;
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
        UUID assigneeId
) {
    // Método auxiliar para facilitar a conversão da Page no Service
    public static TicketResponseDTO fromEntity(Ticket ticket) {
        return new TicketResponseDTO(
                ticket.getId(),
                ticket.getTitle(),
                ticket.getDescription(),
                ticket.getPriority(),
                ticket.getDepartment(),
                ticket.getStatus(),
                ticket.getRequesterId(),
                ticket.getAssigneeId()
        );
    }
}
