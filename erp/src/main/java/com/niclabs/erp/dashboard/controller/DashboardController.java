package com.niclabs.erp.dashboard.controller;

import com.niclabs.erp.dashboard.dto.DashboardResponseDTO;
import com.niclabs.erp.dashboard.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    @PreAuthorize("hasAuthority('ACCESS_DASHBOARD') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<DashboardResponseDTO> getDashboardMetrics() {
        return ResponseEntity.ok(dashboardService.getSystemMetrics());
    }
}