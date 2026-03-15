package com.niclabs.erp.hr.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record EmployeeRequestDTO(
        UUID userId, // Pode vir nulo se o funcionário não tiver acesso ao sistema
        String fullName,
        String cpf,
        String rg,
        LocalDate birthDate,
        String phone,
        String registrationNumber,
        LocalDate admissionDate,
        String jobTitle,
        String department,
        BigDecimal baseSalary,
        String status
) {}