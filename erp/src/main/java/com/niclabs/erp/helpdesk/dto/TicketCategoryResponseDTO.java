package com.niclabs.erp.helpdesk.dto;

import com.niclabs.erp.helpdesk.domain.TicketCategory;
import com.niclabs.erp.helpdesk.domain.TicketDepartment;
import com.niclabs.erp.helpdesk.domain.TicketPriority;

import java.time.LocalDateTime;
import java.util.UUID;

public record TicketCategoryResponseDTO(
        UUID id,
        String name,
        String description,
        TicketPriority priority,
        TicketDepartment department,
        boolean active,
        LocalDateTime createdAt
) {
    public static TicketCategoryResponseDTO fromEntity(TicketCategory c) {
        return new TicketCategoryResponseDTO(
                c.getId(),
                c.getName(),
                c.getDescription(),
                c.getPriority(),
                c.getDepartment(),
                c.isActive(),
                c.getCreatedAt()
        );
    }
}
