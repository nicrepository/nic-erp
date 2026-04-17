package com.niclabs.erp.auth.service;

import com.niclabs.erp.auth.domain.Permission;
import com.niclabs.erp.auth.dto.RoleRequestDTO;
import com.niclabs.erp.auth.dto.RoleResponseDTO;

import java.util.List;
import java.util.UUID;

/**
 * Contract for role and permission management.
 *
 * <p>Roles group permissions and are assigned to users to control access to ERP features.
 * This interface exposes the operations needed to create roles, query available permissions,
 * and update role-permission mappings at runtime.</p>
 */
public interface IRoleService {

    /**
     * Returns all roles with their assigned permissions.
     *
     * @return list of all roles in the system
     */
    List<RoleResponseDTO> getAllRoles();

    /**
     * Returns all registered permissions in the system.
     * Used by the front-end to populate the permission checkbox matrix.
     *
     * @return flat list of every available {@link Permission}
     */
    List<Permission> getAllPermissions();

    /**
     * Creates a new role with an optional initial set of permissions.
     *
     * @param dto role creation payload
     * @return the persisted role summary
     * @throws com.niclabs.erp.exception.DuplicateResourceException if a role with the same name already exists
     */
    RoleResponseDTO createRole(RoleRequestDTO dto);

    /**
     * Replaces the permission set of an existing role.
     *
     * <p>Unknown permission names are silently ignored, allowing partial updates
     * without requiring the caller to enumerate all current permissions.</p>
     *
     * @param roleId      target role identifier
     * @param permissions list of permission names to assign
     * @return updated role summary
     * @throws com.niclabs.erp.exception.ResourceNotFoundException if the role does not exist
     */
    RoleResponseDTO updateRolePermissions(UUID roleId, List<String> permissions);
}
