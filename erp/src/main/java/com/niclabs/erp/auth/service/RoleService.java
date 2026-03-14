package com.niclabs.erp.auth.service;

import com.niclabs.erp.auth.domain.Permission;
import com.niclabs.erp.auth.domain.Role;
import com.niclabs.erp.auth.dto.RoleRequestDTO;
import com.niclabs.erp.auth.dto.RoleResponseDTO;
import com.niclabs.erp.auth.repository.PermissionRepository;
import com.niclabs.erp.auth.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    // Lista todos os Cargos e suas respectivas Permissões
    public List<RoleResponseDTO> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // Lista todas as Permissões cadastradas no banco (Para o React montar os checkboxes)
    public List<Permission> getAllPermissions() {
        return permissionRepository.findAll();
    }

    // Cria um Cargo novo já com as permissões amarradas
    @Transactional
    public RoleResponseDTO createRole(RoleRequestDTO dto) {
        if (roleRepository.findByName(dto.name()).isPresent()) {
            throw new RuntimeException("Este cargo já existe no sistema.");
        }

        Role role = new Role();
        role.setId(UUID.randomUUID());
        role.setName(dto.name());
        role.setPermissions(getPermissionsFromNames(dto.permissions()));

        return mapToDTO(roleRepository.save(role));
    }

    // Atualiza APENAS as permissões de um Cargo que já existe
    @Transactional
    public RoleResponseDTO updateRolePermissions(UUID roleId, List<String> permissions) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("Cargo não encontrado."));

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