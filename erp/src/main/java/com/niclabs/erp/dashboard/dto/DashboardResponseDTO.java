package com.niclabs.erp.dashboard.dto;

public record DashboardResponseDTO(
        // Helpdesk (Insights de TI)
        long openTickets,
        long inProgressTickets,
        long resolvedTickets,

        // Ativos de TI (Equipamentos)
        long totalITAssets,
        long availableITAssets,
        long inUseITAssets,

        // Estoque Administrativo (Suprimentos)
        long totalDistinctStockItems,
        long lowStockItems,

        // Sistema Geral
        long totalUsers
) {}
