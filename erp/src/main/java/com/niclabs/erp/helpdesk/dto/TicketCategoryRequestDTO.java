package com.niclabs.erp.helpdesk.dto;

import com.niclabs.erp.helpdesk.domain.TicketDepartment;
import com.niclabs.erp.helpdesk.domain.TicketPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record TicketCategoryRequestDTO(
        @NotBlank(message = "O nome da categoria é obrigatório.")
        String name,

        String description,

        @NotNull(message = "A prioridade é obrigatória.")
        TicketPriority priority,

        @NotNull(message = "O departamento é obrigatório.")
        TicketDepartment department,

        boolean active
) {
}
