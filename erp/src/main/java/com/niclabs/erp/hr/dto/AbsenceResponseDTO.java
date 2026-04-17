package com.niclabs.erp.hr.dto;

import com.niclabs.erp.hr.domain.AbsenceStatus;
import com.niclabs.erp.hr.domain.AbsenceType;

import java.time.LocalDate;
import java.util.UUID;

public record AbsenceResponseDTO(
        UUID id,
        UUID employeeId,
        String employeeName,
        AbsenceType type,
        LocalDate startDate,
        LocalDate endDate,
        String description,
        AbsenceStatus status
) {}
