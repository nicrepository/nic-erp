package com.niclabs.erp.hr.controller;

import com.niclabs.erp.hr.dto.AbsenceRequestDTO;
import com.niclabs.erp.hr.dto.AbsenceResponseDTO;
import com.niclabs.erp.hr.service.IAbsenceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;

import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.UUID;

/**
 * REST controller for employee absence lifecycle management.
 *
 * <p>Creating or deleting an absence triggers an automatic recalculation of the
 * associated employee's status. Access requires the {@code ACCESS_HR} or
 * {@code ROLE_ADMIN} authority.</p>
 */
@RestController
@RequestMapping("/hr/absences")
@RequiredArgsConstructor
@Tag(name = "RH - Ausências", description = "Registro e gestão de ausências de colaboradores")
public class AbsenceController {

    private final IAbsenceService absenceService;

    /**
     * Records a new absence for an employee.
     *
     * @param dto absence creation payload including employee ID, type, and date range
     * @return 201 Created with the persisted {@link AbsenceResponseDTO}
     */
    @PostMapping
    @PreAuthorize("hasAuthority('ACCESS_HR') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<AbsenceResponseDTO> createAbsence(@Valid @RequestBody AbsenceRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(absenceService.createAbsence(dto));
    }

    /**
     * Retrieves a paginated list of all absences across all employees.
     *
     * @param pageable pagination and sort parameters (default: page 0, size 20, sorted by startDate DESC)
     * @return 200 OK with a page of {@link AbsenceResponseDTO}
     */
    @GetMapping
    @PreAuthorize("hasAuthority('ACCESS_HR') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Page<AbsenceResponseDTO>> getAllAbsences(@PageableDefault(size = 20, sort = "startDate", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(absenceService.getAllAbsences(pageable));
    }

    /**
     * Retrieves all absence records for a specific employee.
     *
     * @param employeeId target employee identifier
     * @return 200 OK with the list of {@link AbsenceResponseDTO} for that employee
     */
    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasAuthority('ACCESS_HR') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<AbsenceResponseDTO>> getAbsencesByEmployee(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(absenceService.getAbsencesByEmployee(employeeId));
    }

    /**
     * Updates an existing absence record and recalculates the employee's status.
     *
     * @param id  target absence identifier
     * @param dto updated absence payload
     * @return 200 OK with the updated {@link AbsenceResponseDTO}
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ACCESS_HR') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<AbsenceResponseDTO> updateAbsence(@PathVariable UUID id, @Valid @RequestBody AbsenceRequestDTO dto) {
        return ResponseEntity.ok(absenceService.updateAbsence(id, dto));
    }

    /**
     * Deletes an absence record and recalculates the affected employee's status.
     *
     * @param id target absence identifier
     * @return 204 No Content on success
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ACCESS_HR') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> deleteAbsence(@PathVariable UUID id) {
        absenceService.deleteAbsence(id);
        return ResponseEntity.noContent().build();
    }
}
