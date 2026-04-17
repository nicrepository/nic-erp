package com.niclabs.erp.hr.dto;

import com.niclabs.erp.hr.domain.EmployeeStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record EmployeeResponseDTO(
        UUID id,
        UUID userId,
        String userEmail,
        String fullName,
        String cpf,
        String rg,
        LocalDate birthDate,
        String phone,
        String registrationNumber,
        LocalDate admissionDate,
        LocalDate terminationDate,
        String jobTitle,
        String department,
        BigDecimal baseSalary,
        EmployeeStatus status
) {}