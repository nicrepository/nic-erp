package com.niclabs.erp.audit.service;

import com.niclabs.erp.audit.dto.AuditLogResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface IAuditService {

    void record(String action, String module, String entityType, UUID entityId, String summary, String details);

    Page<AuditLogResponseDTO> findLogs(String search, String module, Pageable pageable);
}
