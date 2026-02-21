package com.niclabs.erp.helpdesk.dto;

import com.niclabs.erp.helpdesk.domain.TicketDepartment;
import com.niclabs.erp.helpdesk.domain.TicketPriority;

public record TicketRequestDTO(
        String title,
        String description,
        TicketPriority priority,
        TicketDepartment department
) {
}
