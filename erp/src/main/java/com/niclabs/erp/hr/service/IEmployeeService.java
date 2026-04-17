package com.niclabs.erp.hr.service;

import com.niclabs.erp.hr.dto.EmployeeRequestDTO;
import com.niclabs.erp.hr.dto.EmployeeResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * Contract for employee (HR record) lifecycle management.
 *
 * <p>An employee record is distinct from a system user account. An employee may
 * optionally be linked to a {@link com.niclabs.erp.auth.domain.User} for system
 * access, but the HR profile exists independently of login credentials.</p>
 */
public interface IEmployeeService {

    /**
     * Registers a new employee record in the system.
     *
     * @param dto employee creation payload
     * @return the persisted employee summary
     * @throws com.niclabs.erp.exception.DuplicateResourceException if the CPF or registration number is already in use
     */
    EmployeeResponseDTO createEmployee(EmployeeRequestDTO dto);

    /**
     * Updates all mutable fields of an existing employee record.
     *
     * @param id  target employee identifier
     * @param dto updated employee payload
     * @return the updated employee summary
     * @throws com.niclabs.erp.exception.ResourceNotFoundException  if the employee does not exist
     * @throws com.niclabs.erp.exception.DuplicateResourceException if the new CPF or registration number conflicts with another employee
     */
    EmployeeResponseDTO updateEmployee(UUID id, EmployeeRequestDTO dto);

    /**
     * Soft-deletes an employee record. The {@code deleted_at} timestamp is set by
     * the Hibernate {@code @SQLDelete} annotation on the entity.
     *
     * @param id target employee identifier
     * @throws com.niclabs.erp.exception.ResourceNotFoundException if the employee does not exist
     */
    void deleteEmployee(UUID id);

    /**
     * Returns a paginated list of all active (non-deleted) employees.
     *
     * @param pageable pagination and sorting parameters
     * @return page of employee summaries
     */
    Page<EmployeeResponseDTO> listAllEmployees(Pageable pageable);
}
