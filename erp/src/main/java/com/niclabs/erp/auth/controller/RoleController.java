package com.niclabs.erp.auth.controller;

import com.niclabs.erp.auth.domain.Permission;
import com.niclabs.erp.auth.dto.RoleRequestDTO;
import com.niclabs.erp.auth.dto.RoleResponseDTO;
import com.niclabs.erp.auth.service.IRoleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for role and permission management (admin-only).
 *
 * <p>Roles group permissions and are assigned to users to control access to ERP features.
 * All endpoints require the {@code ROLE_ADMIN} authority.</p>
 */
@RestController
@RequestMapping("/roles")
@RequiredArgsConstructor
public class RoleController {

    private final IRoleService roleService;

    // Apenas Administradores de alto nível podem mexer nos Cargos
    /**
     * Retrieves all roles in the system together with their assigned permissions.
     *
     * @return 200 OK with a list of {@link RoleResponseDTO}
     */
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @GetMapping
    public ResponseEntity<List<RoleResponseDTO>> getAllRoles() {
        return ResponseEntity.ok(roleService.getAllRoles());
    }

    /**
     * Retrieves every available permission in the system.
     *
     * <p>Used by the front-end to populate the permission assignment matrix.</p>
     *
     * @return 200 OK with a flat list of {@link Permission}
     */
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @GetMapping("/permissions")
    public ResponseEntity<List<Permission>> getAllPermissions() {
        return ResponseEntity.ok(roleService.getAllPermissions());
    }

    /**
     * Creates a new role with an optional initial set of permissions.
     *
     * @param dto role creation payload containing name and optional permission list
     * @return 201 Created with the persisted {@link RoleResponseDTO}
     */
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @PostMapping
    public ResponseEntity<RoleResponseDTO> createRole(@Valid @RequestBody RoleRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(roleService.createRole(dto));
    }

    /**
     * Replaces the permission set of an existing role entirely.
     *
     * @param id          target role identifier
     * @param permissions list of permission names to assign
     * @return 200 OK with the updated {@link RoleResponseDTO}
     */
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @PutMapping("/{id}/permissions")
    public ResponseEntity<RoleResponseDTO> updateRolePermissions(
            @PathVariable UUID id,
            @RequestBody List<String> permissions) {
        return ResponseEntity.ok(roleService.updateRolePermissions(id, permissions));
    }
}
