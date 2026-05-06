package com.niclabs.erp.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "admin.seed.password=test-only-admin-password-123")
@AutoConfigureMockMvc
class GranularAuthorizationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @WithMockUser(authorities = "ACCESS_USERS_VIEW")
    void usersViewCanListUsersButCannotCreateUsers() throws Exception {
        mockMvc.perform(get("/users"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "View Only",
                                  "email": "view-only@example.com",
                                  "password": "password123"
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "ACCESS_ROLES_MANAGE")
    void rolesManageCanReadPermissions() throws Exception {
        mockMvc.perform(get("/roles/permissions"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = "ACCESS_USERS_VIEW")
    void usersViewCannotReadPermissionCatalog() throws Exception {
        mockMvc.perform(get("/roles/permissions"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "ACCESS_INVENTORY_ADMIN_VIEW")
    void administrativeInventoryViewCanListItemsButCannotCreateItems() throws Exception {
        mockMvc.perform(get("/inventory/administrative/items"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/inventory/administrative/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Material somente leitura",
                                  "category": "Teste",
                                  "minimumStock": 1,
                                  "unitValue": 10.00
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "ACCESS_INVENTORY_ADMIN_MANAGE")
    void administrativeInventoryManageIsNotBlockedByAuthorizationOnCreate() throws Exception {
        mockMvc.perform(post("/inventory/administrative/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Material com permissao de gestao",
                                  "category": "Categoria inexistente para teste",
                                  "minimumStock": 1,
                                  "unitValue": 10.00
                                }
                                """))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    if (status == 403) {
                        throw new AssertionError("ACCESS_INVENTORY_ADMIN_MANAGE should not be blocked by authorization");
                    }
                });
    }

    @Test
    @WithMockUser(authorities = "ACCESS_HR_VIEW")
    void hrViewCanListEmployeesButCannotCreateEmployees() throws Exception {
        mockMvc.perform(get("/hr/employees"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/hr/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "fullName": "Colaborador Leitura",
                                  "cpf": "000.000.000-00",
                                  "registrationNumber": "VIEW-001",
                                  "admissionDate": "2026-01-01",
                                  "jobTitle": "Analista",
                                  "department": "RH",
                                  "status": "ATIVO"
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "ACCESS_HELPDESK_VIEW")
    void helpdeskViewCanListTicketsButCannotAssignTicket() throws Exception {
        mockMvc.perform(get("/helpdesk/tickets"))
                .andExpect(status().isOk());

        mockMvc.perform(put("/helpdesk/tickets/{id}/assign", UUID.randomUUID()))
                .andExpect(status().isForbidden());
    }

}
