package com.niclabs.erp.auth.dto;

import java.util.List;

// Usado para o React ENVIAR os dados de um novo Cargo
public record RoleRequestDTO(
        String name, // Ex: ROLE_FINANCEIRO
        List<String> permissions // Ex: ["ACCESS_INVENTORY", "ACCESS_HELPDESK"]
) {}