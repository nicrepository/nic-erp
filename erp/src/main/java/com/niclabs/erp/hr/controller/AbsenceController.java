package com.niclabs.erp.hr.controller;

import com.niclabs.erp.hr.dto.AbsenceRequestDTO;
import com.niclabs.erp.hr.dto.AbsenceResponseDTO;
import com.niclabs.erp.hr.service.AbsenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/hr/absences")
@RequiredArgsConstructor
public class AbsenceController {

    private final AbsenceService absenceService;

    @PostMapping
    @PreAuthorize("hasAuthority('ACCESS_HR') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> createAbsence(@RequestBody AbsenceRequestDTO dto) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(absenceService.createAbsence(dto));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ACCESS_HR') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<AbsenceResponseDTO>> getAllAbsences() {
        return ResponseEntity.ok(absenceService.getAllAbsences());
    }

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasAuthority('ACCESS_HR') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<AbsenceResponseDTO>> getAbsencesByEmployee(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(absenceService.getAbsencesByEmployee(employeeId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ACCESS_HR') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<AbsenceResponseDTO> updateAbsence(@PathVariable UUID id, @RequestBody AbsenceRequestDTO dto) {
        return ResponseEntity.ok(absenceService.updateAbsence(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ACCESS_HR') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> deleteAbsence(@PathVariable UUID id) {
        absenceService.deleteAbsence(id);
        return ResponseEntity.noContent().build();
    }
}
