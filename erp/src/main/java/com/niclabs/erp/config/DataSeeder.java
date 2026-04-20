package com.niclabs.erp.config;

import com.niclabs.erp.auth.domain.Permission;
import com.niclabs.erp.auth.domain.Role;
import com.niclabs.erp.auth.domain.User;
import com.niclabs.erp.auth.repository.PermissionRepository;
import com.niclabs.erp.auth.repository.RoleRepository;
import com.niclabs.erp.auth.repository.UserRepository;
import com.niclabs.erp.helpdesk.domain.TicketCategory;
import com.niclabs.erp.helpdesk.domain.TicketDepartment;
import com.niclabs.erp.helpdesk.domain.TicketPriority;
import com.niclabs.erp.helpdesk.repository.TicketCategoryRepository;
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
    private final TicketCategoryRepository ticketCategoryRepository;

    @Value("${admin.seed.name:Administrador}")
    private String adminName;

    @Value("${admin.seed.email:admin@nic-labs.com}")
    private String adminEmail;

    @Value("${admin.seed.password}")
    private String adminPassword;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        seedPermissions();
        seedRoles();
        seedAdminUser();
        seedCategories();
    }

    /**
     * Ensures all system permissions exist in the database.
     * Permissions are the atomic capabilities (e.g. ACCESS_INVENTORY_ADMIN) checked by @PreAuthorize.
     * New permissions added here will be created on next startup without data loss.
     */
    private void seedPermissions() {
        List<String> systemPermissions = List.of(
                "ACCESS_INVENTORY_ADMIN",
                "ACCESS_INVENTORY_IT",
                "ACCESS_HELPDESK",
                "ACCESS_USERS",
                "ACCESS_DASHBOARD",
                "ACCESS_ANNOUNCEMENTS_MANAGE"
        );

        for (String permName : systemPermissions) {
            if (permissionRepository.findByName(permName).isEmpty()) {
                Permission newPerm = new Permission();
                newPerm.setId(UUID.randomUUID());
                newPerm.setName(permName);
                permissionRepository.save(newPerm);
            }
        }
    }

    /**
     * Ensures ROLE_ADMIN (all permissions) and ROLE_USER (no permissions) exist.
     * ROLE_USER is the default role assigned to every new registered user.
     */
    private void seedRoles() {
        if (roleRepository.findByName("ROLE_ADMIN").isEmpty()) {
            Role adminRole = new Role();
            adminRole.setId(UUID.randomUUID());
            adminRole.setName("ROLE_ADMIN");
            adminRole.setPermissions(new HashSet<>(permissionRepository.findAll()));
            roleRepository.save(adminRole);
        }

        if (roleRepository.findByName("ROLE_USER").isEmpty()) {
            Role userRole = new Role();
            userRole.setId(UUID.randomUUID());
            userRole.setName("ROLE_USER");
            roleRepository.save(userRole);
        }
    }

    /**
     * Creates the initial admin user only when the users table is completely empty.
     * Credentials are sourced from environment variables to support secure deployments.
     */
    private void seedAdminUser() {
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

    /**
     * Seeds default ticket categories on first startup.
     */
    private void seedCategories() {
        if (ticketCategoryRepository.count() == 0) {
            List<TicketCategory> defaults = List.of(
                new TicketCategory(UUID.randomUUID(), "Sistema fora do ar", "Indisponibilidade total de sistema ou serviço", TicketPriority.URGENT, TicketDepartment.IT, true, null),
                new TicketCategory(UUID.randomUUID(), "Sem acesso a sistemas", "Usuário não consegue acessar sistema ou aplicação", TicketPriority.URGENT, TicketDepartment.IT, true, null),
                new TicketCategory(UUID.randomUUID(), "Equipamento com defeito", "Hardware com mau funcionamento ou falha", TicketPriority.HIGH, TicketDepartment.IT, true, null),
                new TicketCategory(UUID.randomUUID(), "Instalação de software", "Solicitação de instalação ou atualização de programa", TicketPriority.MEDIUM, TicketDepartment.IT, true, null),
                new TicketCategory(UUID.randomUUID(), "Impressora / Periférico", "Problemas com impressora, scanner ou outros periféricos", TicketPriority.MEDIUM, TicketDepartment.IT, true, null),
                new TicketCategory(UUID.randomUUID(), "Solicitação de acesso", "Pedido de criação ou liberação de acesso a sistemas", TicketPriority.LOW, TicketDepartment.IT, true, null),
                new TicketCategory(UUID.randomUUID(), "Manutenção predial", "Reparos elétricos, hidráulicos ou estruturais", TicketPriority.HIGH, TicketDepartment.MAINTENANCE, true, null),
                new TicketCategory(UUID.randomUUID(), "Requisição de RH", "Férias, documentos, benefícios e outros pedidos de RH", TicketPriority.LOW, TicketDepartment.HR, true, null),
                new TicketCategory(UUID.randomUUID(), "Solicitação administrativa", "Compras, suprimentos e demandas do administrativo", TicketPriority.LOW, TicketDepartment.ADMIN, true, null),
                new TicketCategory(UUID.randomUUID(), "Dúvida / Orientação", "Questões gerais que não se enquadram nas categorias acima", TicketPriority.LOW, TicketDepartment.IT, true, null)
            );
            ticketCategoryRepository.saveAll(defaults);
        }
    }
}