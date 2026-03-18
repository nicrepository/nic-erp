package com.niclabs.erp.hr.dto;

import java.time.LocalDate;
import java.util.UUID;

public record AbsenceResponseDTO(
        UUID id,
        UUID employeeId,
        String employeeName, // Fundamental para não termos que buscar o nome separadamente
        String type,
        LocalDate startDate,
        LocalDate endDate,
        String description,
        String status
) {}
