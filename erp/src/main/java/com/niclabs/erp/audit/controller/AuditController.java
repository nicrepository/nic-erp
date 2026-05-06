package com.niclabs.erp.audit.controller;

import com.niclabs.erp.audit.dto.AuditLogResponseDTO;
import com.niclabs.erp.audit.service.IAuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/audit")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AuditController {

    private final IAuditService auditService;

    @GetMapping("/logs")
    public ResponseEntity<Page<AuditLogResponseDTO>> findLogs(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String module,
            @PageableDefault(size = 20, sort = "occurredAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(auditService.findLogs(search, module, pageable));
    }
}
