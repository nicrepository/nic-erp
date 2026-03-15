package com.niclabs.erp.hr.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record EmployeeResponseDTO(
        UUID id,
        UUID userId,           // ID do usuário vinculado (se houver)
        String userEmail,      // E-mail do usuário vinculado (muito útil para exibir na tabela do Front-end)
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