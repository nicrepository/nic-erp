package com.niclabs.erp.hr.service;

import com.niclabs.erp.auth.repository.UserRepository;
import com.niclabs.erp.exception.DuplicateResourceException;
import com.niclabs.erp.exception.ResourceNotFoundException;
import com.niclabs.erp.hr.domain.EmployeeStatus;
import com.niclabs.erp.hr.dto.EmployeeRequestDTO;
import com.niclabs.erp.hr.repository.EmployeeRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {

    @Mock EmployeeRepository employeeRepository;
    @Mock UserRepository userRepository;

    @InjectMocks EmployeeService employeeService;

    private EmployeeRequestDTO buildDto(String cpf, String registration) {
        return new EmployeeRequestDTO(
                null, "Maria Oliveira", cpf, null, null, null,
                registration, LocalDate.now(), null,
                "Analista", "TI", BigDecimal.valueOf(5000), EmployeeStatus.ATIVO
        );
    }

    @Test
    void createEmployee_shouldThrow_whenCpfAlreadyExists() {
        when(employeeRepository.findByCpf("12345678901")).thenReturn(Optional.of(new com.niclabs.erp.hr.domain.Employee()));

        assertThatThrownBy(() -> employeeService.createEmployee(buildDto("12345678901", "MAT001")))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("CPF");

        verify(employeeRepository, never()).save(any());
    }

    @Test
    void createEmployee_shouldThrow_whenRegistrationNumberAlreadyExists() {
        when(employeeRepository.findByCpf("99999999999")).thenReturn(Optional.empty());
        when(employeeRepository.findByRegistrationNumber("MAT001")).thenReturn(Optional.of(new com.niclabs.erp.hr.domain.Employee()));

        assertThatThrownBy(() -> employeeService.createEmployee(buildDto("99999999999", "MAT001")))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("matrícula");

        verify(employeeRepository, never()).save(any());
    }

    @Test
    void updateEmployee_shouldThrow_whenEmployeeNotFound() {
        UUID unknownId = UUID.randomUUID();
        when(employeeRepository.findById(unknownId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> employeeService.updateEmployee(unknownId, buildDto("11122233344", "MAT002")))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
