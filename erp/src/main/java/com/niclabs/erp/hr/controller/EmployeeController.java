package com.niclabs.erp.hr.controller;

import java.util.UUID;
import com.niclabs.erp.hr.dto.EmployeeRequestDTO;
import com.niclabs.erp.hr.dto.EmployeeResponseDTO;
import com.niclabs.erp.hr.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/hr/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;

    @PostMapping
    // Protegemos a rota: Apenas Admin ou a galera do RH podem cadastrar funcionários
    @PreAuthorize("hasAuthority('ACCESS_HR') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> createEmployee(@RequestBody EmployeeRequestDTO dto) {
        try {
            EmployeeResponseDTO createdEmployee = employeeService.createEmployee(dto);
            // Retorna 201 Created quando o cadastro é feito com sucesso
            return ResponseEntity.status(HttpStatus.CREATED).body(createdEmployee);
        } catch (RuntimeException e) {
            // Se cair na regra do CPF ou Matrícula duplicada, devolvemos o erro 400 amigável para o React
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    // Protegemos a rota de listagem
    @PreAuthorize("hasAuthority('ACCESS_HR') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<EmployeeResponseDTO>> listAllEmployees() {
        return ResponseEntity.ok(employeeService.listAllEmployees());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ACCESS_HR') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> updateEmployee(
            @PathVariable UUID id,
            @RequestBody EmployeeRequestDTO dto) {
        try {
            EmployeeResponseDTO updatedEmployee = employeeService.updateEmployee(id, dto);
            return ResponseEntity.ok(updatedEmployee);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
