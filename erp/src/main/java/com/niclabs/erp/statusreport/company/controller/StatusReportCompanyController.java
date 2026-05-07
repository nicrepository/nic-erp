package com.niclabs.erp.statusreport.company.controller;

import com.niclabs.erp.statusreport.company.dto.*;
import com.niclabs.erp.statusreport.company.service.StatusReportCompanyService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/status-report-companies")
public class StatusReportCompanyController {

    private final StatusReportCompanyService service;

    public StatusReportCompanyController(StatusReportCompanyService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<StatusReportCompanyResponse> create(@RequestBody @Valid CreateStatusReportCompanyRequest request, Principal principal) {
        return ResponseEntity.ok(service.create(request, principal));
    }

    @GetMapping
    public ResponseEntity<List<StatusReportCompanyResponse>> list(@RequestParam(required = false) String search) {
        return ResponseEntity.ok(service.findAllActive(search));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, Principal principal) {
        service.delete(id, principal);
        return ResponseEntity.noContent().build();
    }
}