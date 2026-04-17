package com.niclabs.erp.hr.service;

import com.niclabs.erp.exception.BusinessException;
import com.niclabs.erp.exception.ResourceNotFoundException;
import com.niclabs.erp.hr.domain.AbsenceType;
import com.niclabs.erp.hr.domain.Absence;
import com.niclabs.erp.hr.domain.Employee;
import com.niclabs.erp.hr.dto.AbsenceRequestDTO;
import com.niclabs.erp.hr.repository.AbsenceRepository;
import com.niclabs.erp.hr.repository.EmployeeRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AbsenceServiceTest {

    @Mock AbsenceRepository absenceRepository;
    @Mock EmployeeRepository employeeRepository;

    @InjectMocks AbsenceService absenceService;

    private AbsenceRequestDTO dto(UUID empId, LocalDate start, LocalDate end) {
        return new AbsenceRequestDTO(empId, AbsenceType.FERIAS, start, end, null, null);
    }

    @Test
    void createAbsence_shouldThrow_whenEndDateBeforeStartDate() {
        UUID empId = UUID.randomUUID();
        LocalDate start = LocalDate.of(2025, 6, 10);
        LocalDate end = LocalDate.of(2025, 6, 5); // before start

        assertThatThrownBy(() -> absenceService.createAbsence(dto(empId, start, end)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("término");
    }

    @Test
    void createAbsence_shouldThrow_whenEmployeeNotFound() {
        UUID unknownId = UUID.randomUUID();
        LocalDate start = LocalDate.of(2025, 6, 1);
        LocalDate end = LocalDate.of(2025, 6, 15);

        when(employeeRepository.findById(unknownId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> absenceService.createAbsence(dto(unknownId, start, end)))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateAbsence_shouldThrow_whenAbsenceNotFound() {
        UUID unknownId = UUID.randomUUID();
        UUID empId = UUID.randomUUID();

        when(absenceRepository.findById(unknownId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> absenceService.updateAbsence(unknownId, dto(empId, LocalDate.now(), LocalDate.now().plusDays(5))))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteAbsence_shouldThrow_whenAbsenceNotFound() {
        UUID unknownId = UUID.randomUUID();
        when(absenceRepository.findById(unknownId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> absenceService.deleteAbsence(unknownId))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(absenceRepository, never()).delete(any());
    }
}
