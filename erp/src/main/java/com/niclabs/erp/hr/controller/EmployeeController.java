package com.niclabs.erp.hr.controller;

import java.util.UUID;
import com.niclabs.erp.hr.dto.EmployeeRequestDTO;
import com.niclabs.erp.hr.dto.EmployeeResponseDTO;
import com.niclabs.erp.hr.service.IEmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;

import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;

/**
 * REST controller for employee (HR record) lifecycle management.
 *
 * <p>An employee record represents a person's HR profile and is distinct from a system
 * user account. Access is restricted to users with the {@code ACCESS_HR} or
 * {@code ROLE_ADMIN} authority.</p>
 */
@RestController
@RequestMapping("/hr/employees")
@RequiredArgsConstructor
@Tag(name = "RH - Colaboradores", description = "Cadastro e gestão de colaboradores")
public class EmployeeController {

    private final IEmployeeService employeeService;

    /**
     * Registers a new employee record in the HR system.
     *
     * @param dto employee creation payload
     * @return 201 Created with the persisted {@link EmployeeResponseDTO}
     */
    @PostMapping
    @PreAuthorize("hasAuthority('ACCESS_HR') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<EmployeeResponseDTO> createEmployee(@Valid @RequestBody EmployeeRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(employeeService.createEmployee(dto));
    }

    /**
     * Retrieves a paginated list of all active employees.
     *
     * @param pageable pagination and sort parameters (default: page 0, size 20, sorted by fullName)
     * @return 200 OK with a page of {@link EmployeeResponseDTO}
     */
    @GetMapping
    @PreAuthorize("hasAuthority('ACCESS_HR') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Page<EmployeeResponseDTO>> listAllEmployees(@PageableDefault(size = 20, sort = "fullName") Pageable pageable) {
        return ResponseEntity.ok(employeeService.listAllEmployees(pageable));
    }

    /**
     * Updates all mutable fields of an existing employee record.
     *
     * @param id  target employee identifier
     * @param dto updated employee payload
     * @return 200 OK with the updated {@link EmployeeResponseDTO}
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ACCESS_HR') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<EmployeeResponseDTO> updateEmployee(
            @PathVariable UUID id,
            @Valid @RequestBody EmployeeRequestDTO dto) {
        return ResponseEntity.ok(employeeService.updateEmployee(id, dto));
    }

    /**
     * Soft-deletes an employee record, preserving historical data.
     *
     * @param id target employee identifier
     * @return 204 No Content on success
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ACCESS_HR') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> deleteEmployee(@PathVariable UUID id) {
        employeeService.deleteEmployee(id);
        return ResponseEntity.noContent().build();
    }
}
