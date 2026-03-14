package com.niclabs.erp.auth.controller;

import com.niclabs.erp.auth.domain.Permission;
import com.niclabs.erp.auth.dto.RoleRequestDTO;
import com.niclabs.erp.auth.dto.RoleResponseDTO;
import com.niclabs.erp.auth.service.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;

    // Apenas Administradores de alto nível podem mexer nos Cargos
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @GetMapping
    public ResponseEntity<List<RoleResponseDTO>> getAllRoles() {
        return ResponseEntity.ok(roleService.getAllRoles());
    }

    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @GetMapping("/permissions")
    public ResponseEntity<List<Permission>> getAllPermissions() {
        return ResponseEntity.ok(roleService.getAllPermissions());
    }

    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @PostMapping
    public ResponseEntity<RoleResponseDTO> createRole(@RequestBody RoleRequestDTO dto) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(roleService.createRole(dto));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build(); // Retorna 400 se já existir
        }
    }

    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @PutMapping("/{id}/permissions")
    public ResponseEntity<RoleResponseDTO> updateRolePermissions(
            @PathVariable UUID id,
            @RequestBody List<String> permissions) {
        return ResponseEntity.ok(roleService.updateRolePermissions(id, permissions));
    }
}
