package com.niclabs.erp.hr.service;

import com.niclabs.erp.hr.dto.AbsenceRequestDTO;
import com.niclabs.erp.hr.dto.AbsenceResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

/**
 * Contract for employee absence lifecycle management.
 *
 * <p>Creating or deleting an absence triggers a status recalculation on the associated
 * employee. Active absences (whose date range covers today) automatically update the
 * employee's {@link com.niclabs.erp.hr.domain.EmployeeStatus} to reflect the absence type.</p>
 */
public interface IAbsenceService {

    /**
     * Records a new absence. If the absence covers today, the employee's status
     * is immediately updated to reflect the absence type.
     *
     * @param dto absence creation payload
     * @return the persisted absence summary
     * @throws com.niclabs.erp.exception.BusinessException         if end date precedes start date
     * @throws com.niclabs.erp.exception.ResourceNotFoundException if the employee does not exist
     */
    AbsenceResponseDTO createAbsence(AbsenceRequestDTO dto);

    /**
     * Returns all absences for a specific employee, ordered by start date descending.
     *
     * @param employeeId target employee identifier
     * @return list of the employee's absence records
     */
    List<AbsenceResponseDTO> getAbsencesByEmployee(UUID employeeId);

    /**
     * Returns a paginated list of all absences in the system.
     *
     * @param pageable pagination and sorting parameters
     * @return page of absence summaries
     */
    Page<AbsenceResponseDTO> getAllAbsences(Pageable pageable);

    /**
     * Updates an existing absence and triggers employee status recalculation.
     *
     * @param id  target absence identifier
     * @param dto updated absence payload
     * @return the updated absence summary
     * @throws com.niclabs.erp.exception.ResourceNotFoundException if the absence does not exist
     * @throws com.niclabs.erp.exception.BusinessException         if end date precedes start date
     */
    AbsenceResponseDTO updateAbsence(UUID id, AbsenceRequestDTO dto);

    /**
     * Deletes an absence and recalculates the employee's status.
     * Employees who were absent solely due to this record may return to {@code ATIVO}.
     *
     * @param id target absence identifier
     * @throws com.niclabs.erp.exception.ResourceNotFoundException if the absence does not exist
     */
    void deleteAbsence(UUID id);
}
