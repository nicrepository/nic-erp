package com.niclabs.erp.config;

import com.niclabs.erp.auth.domain.Permission;
import com.niclabs.erp.auth.domain.Role;
import com.niclabs.erp.auth.domain.User;
import com.niclabs.erp.auth.repository.PermissionRepository;
import com.niclabs.erp.auth.repository.RoleRepository;
import com.niclabs.erp.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.seed.name:Administrador}")
    private String adminName;

    @Value("${admin.seed.email:admin@nic-labs.com}")
    private String adminEmail;

    @Value("${admin.seed.password:admin123}")
    private String adminPassword;

    @Override
    @Transactional
    public void run(String... args) throws Exception {

        // 1. LISTA DE PERMISSÕES OFICIAIS DO NIC-ERP
        List<String> systemPermissions = List.of(
                "ACCESS_INVENTORY_ADMIN",
                "ACCESS_INVENTORY_IT",
                "ACCESS_HELPDESK",
                "ACCESS_USERS",
                "ACCESS_DASHBOARD",
                "ACCESS_ANNOUNCEMENTS_MANAGE"
        );

        // 2. SALVA AS PERMISSÕES NO BANCO SE ELAS NÃO EXISTIREM
        for (String permName : systemPermissions) {
            if (permissionRepository.findByName(permName).isEmpty()) {
                Permission newPerm = new Permission();
                newPerm.setId(UUID.randomUUID());
                newPerm.setName(permName);
                permissionRepository.save(newPerm);
            }
        }

        // 3. GARANTE QUE A ROLE_ADMIN E A ROLE_USER EXISTEM PARA O SISTEMA NÃO QUEBRAR
        if (roleRepository.findByName("ROLE_ADMIN").isEmpty()) {
            Role adminRole = new Role();
            adminRole.setId(UUID.randomUUID());
            adminRole.setName("ROLE_ADMIN");
            // O Admin ganha todas as permissões por padrão
            adminRole.setPermissions(new HashSet<>(permissionRepository.findAll()));
            roleRepository.save(adminRole);
        }

        if (roleRepository.findByName("ROLE_USER").isEmpty()) {
            Role userRole = new Role();
            userRole.setId(UUID.randomUUID());
            userRole.setName("ROLE_USER");
            // Usuário comum nasce sem permissões especiais, só o básico
            roleRepository.save(userRole);
        }

        // 4. CRIA O USUÁRIO ADMIN INICIAL SE O BANCO NÃO TIVER NENHUM USUÁRIO
        if (userRepository.count() == 0) {
            Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                    .orElseThrow(() -> new IllegalStateException("ROLE_ADMIN não encontrada após seed"));

            User admin = new User();
            admin.setId(UUID.randomUUID());
            admin.setName(adminName);
            admin.setEmail(adminEmail);
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setActive(true);
            admin.setRoles(Set.of(adminRole));
            userRepository.save(admin);
        }
    }
}