package com.niclabs.erp.statusreport.report.controller;

import com.niclabs.erp.statusreport.report.dto.CreateStatusReportRequest;
import com.niclabs.erp.statusreport.report.dto.StatusReportResponse;
import com.niclabs.erp.statusreport.report.dto.UpdateStatusReportRequest;
import com.niclabs.erp.statusreport.report.dto.UpdateStrategicLevelRequest;
import com.niclabs.erp.statusreport.report.service.StatusReportService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/status-reports")
public class StatusReportController {

    private final StatusReportService service;

    public StatusReportController(StatusReportService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<StatusReportResponse>> findAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<StatusReportResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<StatusReportResponse> create(
            @RequestBody @Valid CreateStatusReportRequest request,
            Principal principal
    ) {
        return ResponseEntity.ok(service.create(request, principal));
    }

    @PutMapping("/{id}")
    public ResponseEntity<StatusReportResponse> update(
            @PathVariable UUID id,
            @RequestBody @Valid UpdateStatusReportRequest request,
            Principal principal
    ) {
        return ResponseEntity.ok(service.update(id, request, principal));
    }

    @PatchMapping("/{id}/strategic-level")
    public ResponseEntity<Void> updateStrategic(
            @PathVariable UUID id,
            @RequestBody @Valid UpdateStrategicLevelRequest request,
            Principal principal
    ) {
        service.updateStrategicLevel(id, request, principal);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            Principal principal
    ) {
        service.delete(id, principal);
        return ResponseEntity.noContent().build();
    }
}