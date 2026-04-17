package com.niclabs.erp.hr.dto;

import com.niclabs.erp.hr.domain.AbsenceStatus;
import com.niclabs.erp.hr.domain.AbsenceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record AbsenceRequestDTO(
        @NotNull(message = "O ID do colaborador é obrigatório.")
        UUID employeeId,

        @NotNull(message = "O tipo de ausência é obrigatório.")
        AbsenceType type,

        @NotNull(message = "A data de início é obrigatória.")
        LocalDate startDate,

        @NotNull(message = "A data de término é obrigatória.")
        LocalDate endDate,

        String description,
        AbsenceStatus status
) {}
