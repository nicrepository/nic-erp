package com.niclabs.erp.hr.dto;

import com.niclabs.erp.hr.domain.EmployeeStatus;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record EmployeeRequestDTO(
        UUID userId,

        @NotBlank(message = "O nome completo é obrigatório.")
        String fullName,

        @NotBlank(message = "O CPF é obrigatório.")
        @Size(min = 11, max = 14, message = "CPF inválido.")
        String cpf,

        String rg,
        LocalDate birthDate,
        String phone,

        @NotBlank(message = "A matrícula corporativa é obrigatória.")
        String registrationNumber,

        @NotNull(message = "A data de admissão é obrigatória.")
        LocalDate admissionDate,

        LocalDate terminationDate,

        @NotBlank(message = "O cargo é obrigatório.")
        String jobTitle,

        @NotBlank(message = "O departamento é obrigatório.")
        String department,

        @DecimalMin(value = "0.0", inclusive = false, message = "O salário base deve ser maior que zero.")
        BigDecimal baseSalary,

        EmployeeStatus status
) {}
