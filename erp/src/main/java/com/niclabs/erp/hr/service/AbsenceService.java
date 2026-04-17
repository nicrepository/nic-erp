package com.niclabs.erp.hr.service;

import com.niclabs.erp.hr.domain.Absence;
import com.niclabs.erp.hr.domain.AbsenceStatus;
import com.niclabs.erp.hr.domain.Employee;
import com.niclabs.erp.hr.domain.EmployeeStatus;
import com.niclabs.erp.hr.dto.AbsenceRequestDTO;
import com.niclabs.erp.hr.dto.AbsenceResponseDTO;
import com.niclabs.erp.hr.repository.AbsenceRepository;
import com.niclabs.erp.hr.repository.EmployeeRepository;
import com.niclabs.erp.exception.BusinessException;
import com.niclabs.erp.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Manages employee absences (vacations, sick leave, etc.) and keeps employee status in sync.
 *
 * <p>Write operations are wrapped in {@code @Transactional}. Read operations use
 * {@code readOnly = true} to skip dirty checking and optimise connection pool usage.</p>
 */
@Service
@RequiredArgsConstructor
public class AbsenceService implements IAbsenceService {

    private final AbsenceRepository absenceRepository;
    private final EmployeeRepository employeeRepository;

    /**
     * Records a new absence and immediately updates the employee's status if the absence is active today.
     *
     * @param dto absence data including employee, type, and date range
     * @return the created {@link AbsenceResponseDTO}
     * @throws BusinessException if the end date is before the start date
     */
    @Transactional
    public AbsenceResponseDTO createAbsence(AbsenceRequestDTO dto) {
        if (dto.endDate().isBefore(dto.startDate())) {
            throw new BusinessException("A data de término não pode ser anterior à data de início.");
        }

        Employee employee = employeeRepository.findById(dto.employeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Colaborador não encontrado no sistema."));

        Absence absence = new Absence();
        absence.setEmployee(employee);
        absence.setType(dto.type());
        absence.setStartDate(dto.startDate());
        absence.setEndDate(dto.endDate());
        absence.setDescription(dto.description());
        absence.setStatus(dto.status() != null ? dto.status() : AbsenceStatus.AGENDADO);

        LocalDate today = LocalDate.now();
        if (!absence.getStartDate().isAfter(today) && !absence.getEndDate().isBefore(today)) {
            EmployeeStatus newStatus = absence.getType().toEmployeeStatus();
            if (newStatus != employee.getStatus()) {
                employee.setStatus(newStatus);
                employeeRepository.save(employee);
            }
        }

        return mapToDTO(absenceRepository.save(absence));
    }

    /**
     * Returns all absences for a specific employee, most recent first.
     *
     * @param employeeId target employee identifier
     * @return list of {@link AbsenceResponseDTO}
     */
    @Transactional(readOnly = true)
    public List<AbsenceResponseDTO> getAbsencesByEmployee(UUID employeeId) {
        return absenceRepository.findByEmployeeIdOrderByStartDateDesc(employeeId).stream()
                .map(this::mapToDTO)
                .toList();
    }

    /**
     * Returns a paginated list of all absences across all employees.
     *
     * @param pageable pagination and sort parameters
     * @return page of {@link AbsenceResponseDTO}
     */
    @Transactional(readOnly = true)
    public Page<AbsenceResponseDTO> getAllAbsences(Pageable pageable) {
        return absenceRepository.findAllWithEmployee(pageable)
                .map(this::mapToDTO);
    }

    private AbsenceResponseDTO mapToDTO(Absence absence) {
        return new AbsenceResponseDTO(
                absence.getId(),
                absence.getEmployee().getId(),
                absence.getEmployee().getFullName(),
                absence.getType(),
                absence.getStartDate(),
                absence.getEndDate(),
                absence.getDescription(),
                absence.getStatus()
        );
    }

    /**
     * Updates an existing absence and recalculates the employee's current status.
     *
     * @param id  absence identifier
     * @param dto updated absence data
     * @return updated {@link AbsenceResponseDTO}
     * @throws BusinessException         if the end date is before the start date
     * @throws ResourceNotFoundException if the absence does not exist
     */
    @Transactional
    public AbsenceResponseDTO updateAbsence(UUID id, AbsenceRequestDTO dto) {
        Absence absence = absenceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ausência não encontrada."));

        if (dto.endDate().isBefore(dto.startDate())) {
            throw new BusinessException("A data de término não pode ser anterior à data de início.");
        }

        absence.setType(dto.type());
        absence.setStartDate(dto.startDate());
        absence.setEndDate(dto.endDate());
        absence.setDescription(dto.description());

        Absence updatedAbsence = absenceRepository.save(absence);
        recalculateEmployeeStatus(updatedAbsence.getEmployee());

        return mapToDTO(updatedAbsence);
    }

    /**
     * Removes an absence record and recalculates the employee's status based on remaining absences.
     *
     * @param id absence identifier
     * @throws ResourceNotFoundException if the absence does not exist
     */
    @Transactional
    public void deleteAbsence(UUID id) {
        Absence absence = absenceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ausência não encontrada."));

        Employee emp = absence.getEmployee();
        absenceRepository.delete(absence);

        absenceRepository.flush();
        recalculateEmployeeStatus(emp);
    }

    private void recalculateEmployeeStatus(Employee emp) {
        if (emp.getStatus() == EmployeeStatus.DESLIGADO) return;

        LocalDate today = LocalDate.now();
        List<Absence> currentAbsences = absenceRepository.findActiveAbsencesByEmployee(emp.getId(), today);

        if (!currentAbsences.isEmpty()) {
            emp.setStatus(currentAbsences.get(0).getType().toEmployeeStatus());
        } else {
            emp.setStatus(EmployeeStatus.ATIVO);
        }
        employeeRepository.save(emp);
    }
}

