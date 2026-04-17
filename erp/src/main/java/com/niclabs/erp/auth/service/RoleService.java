package com.niclabs.erp.auth.service;

import com.niclabs.erp.auth.domain.Permission;
import com.niclabs.erp.auth.domain.Role;
import com.niclabs.erp.auth.dto.RoleRequestDTO;
import com.niclabs.erp.auth.dto.RoleResponseDTO;
import com.niclabs.erp.auth.repository.PermissionRepository;
import com.niclabs.erp.auth.repository.RoleRepository;
import com.niclabs.erp.exception.DuplicateResourceException;
import com.niclabs.erp.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Manages roles and their associated permissions for access-control configuration.
 *
 * <p>Write operations are wrapped in {@code @Transactional}. Read operations use
 * {@code readOnly = true} to skip dirty checking and optimise connection pool usage.</p>
 */
@Service
@RequiredArgsConstructor
public class RoleService implements IRoleService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    /**
     * Returns all roles together with their assigned permissions.
     *
     * @return list of {@link RoleResponseDTO}
     */
    @Transactional(readOnly = true)
    public List<RoleResponseDTO> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Returns all permissions available in the system, used to populate role-editor checkboxes.
     *
     * @return list of {@link Permission}
     */
    @Transactional(readOnly = true)
    public List<Permission> getAllPermissions() {
        return permissionRepository.findAll();
    }

    /**
     * Creates a new role with the given name and initial set of permissions.
     *
     * @param dto role name and permission names to assign
     * @return the created {@link RoleResponseDTO}
     * @throws DuplicateResourceException if a role with the same name already exists
     */
    @Transactional
    public RoleResponseDTO createRole(RoleRequestDTO dto) {
        if (roleRepository.findByName(dto.name()).isPresent()) {
            throw new DuplicateResourceException("Este cargo já existe no sistema.");
        }

        Role role = new Role();
        role.setId(UUID.randomUUID());
        role.setName(dto.name());
        role.setPermissions(getPermissionsFromNames(dto.permissions()));

        return mapToDTO(roleRepository.save(role));
    }

    /**
     * Replaces the full set of permissions assigned to a role.
     *
     * @param roleId      target role identifier
     * @param permissions new list of permission names
     * @return updated {@link RoleResponseDTO}
     * @throws ResourceNotFoundException if no role exists with the given id
     */
    @Transactional
    public RoleResponseDTO updateRolePermissions(UUID roleId, List<String> permissions) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Cargo não encontrado."));

        role.setPermissions(getPermissionsFromNames(permissions));
        return mapToDTO(roleRepository.save(role));
    }

    // --- MÉTODOS AUXILIARES ---

    private Set<Permission> getPermissionsFromNames(List<String> permissionNames) {
        Set<Permission> permissions = new HashSet<>();
        if (permissionNames != null) {
            for (String name : permissionNames) {
                permissionRepository.findByName(name).ifPresent(permissions::add);
            }
        }
        return permissions;
    }

    private RoleResponseDTO mapToDTO(Role role) {
        List<String> perms = role.getPermissions() != null
                ? role.getPermissions().stream().map(Permission::getName).collect(Collectors.toList())
                : List.of();
        return new RoleResponseDTO(role.getId(), role.getName(), perms);
    }
}