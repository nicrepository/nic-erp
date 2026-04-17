package com.niclabs.erp.dashboard.controller;

import com.niclabs.erp.dashboard.dto.DashboardResponseDTO;
import com.niclabs.erp.dashboard.service.IDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for dashboard metric aggregation.
 *
 * <p>Provides a single endpoint that aggregates read-only counters from multiple modules
 * (Helpdesk, Inventory, Auth) into a summary payload for the front-end dashboard cards.</p>
 */
@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final IDashboardService dashboardService;

    /**
     * Retrieves the current system-wide metrics snapshot for the dashboard.
     *
     * @return 200 OK with a {@link DashboardResponseDTO} containing aggregated counters
     */
    @GetMapping
    @PreAuthorize("hasAuthority('ACCESS_DASHBOARD') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<DashboardResponseDTO> getDashboardMetrics() {
        return ResponseEntity.ok(dashboardService.getSystemMetrics());
    }
}