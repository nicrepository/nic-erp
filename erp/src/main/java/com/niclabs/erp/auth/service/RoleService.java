package com.niclabs.erp.auth.service;

import com.niclabs.erp.auth.domain.Permission;
import com.niclabs.erp.auth.domain.Role;
import com.niclabs.erp.auth.dto.RoleRequestDTO;
import com.niclabs.erp.auth.dto.RoleResponseDTO;
import com.niclabs.erp.auth.repository.PermissionRepository;
import com.niclabs.erp.auth.repository.RoleRepository;
import com.niclabs.erp.exception.BusinessException;
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
    private static final Set<String> PROTECTED_ROLES = Set.of("ROLE_ADMIN", "ROLE_USER");

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
        String roleName = normalizeRoleName(dto.name());
        if (roleRepository.findByName(roleName).isPresent()) {
            throw new DuplicateResourceException("Este cargo já existe no sistema.");
        }

        Role role = new Role();
        role.setId(UUID.randomUUID());
        role.setName(roleName);
        role.setPermissions(getPermissionsFromNames(dto.permissions()));

        return mapToDTO(roleRepository.save(role));
    }

    /**
     * Updates the role name and permission set.
     *
     * @param roleId target role identifier
     * @param dto    updated role payload
     * @return updated {@link RoleResponseDTO}
     */
    @Transactional
    public RoleResponseDTO updateRole(UUID roleId, RoleRequestDTO dto) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Cargo não encontrado."));

        ensureRoleCanBeRenamedOrDeleted(role);

        String roleName = normalizeRoleName(dto.name());
        roleRepository.findByName(roleName)
                .filter(existing -> !existing.getId().equals(roleId))
                .ifPresent(existing -> {
                    throw new DuplicateResourceException("Este cargo já existe no sistema.");
                });

        role.setName(roleName);
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

    /**
     * Deletes a custom role. Protected system roles cannot be removed.
     *
     * @param roleId target role identifier
     */
    @Transactional
    public void deleteRole(UUID roleId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Cargo não encontrado."));

        ensureRoleCanBeRenamedOrDeleted(role);
        roleRepository.delete(role);
    }

    // --- MÉTODOS AUXILIARES ---

    private String normalizeRoleName(String name) {
        String cleanedName = name == null ? "" : name.trim().toUpperCase();
        return cleanedName.startsWith("ROLE_") ? cleanedName : "ROLE_" + cleanedName;
    }

    private void ensureRoleCanBeRenamedOrDeleted(Role role) {
        if (PROTECTED_ROLES.contains(role.getName())) {
            throw new BusinessException("Este cargo é essencial para o sistema e não pode ser renomeado ou excluído.");
        }
    }

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
