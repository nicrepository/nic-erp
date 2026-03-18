package com.niclabs.erp.hr.dto;

import java.time.LocalDate;
import java.util.UUID;

public record AbsenceRequestDTO(
        UUID employeeId,
        String type, // FERIAS, DAY_OFF, ATESTADO, LICENCA
        LocalDate startDate,
        LocalDate endDate,
        String description,
        String status
) {}
