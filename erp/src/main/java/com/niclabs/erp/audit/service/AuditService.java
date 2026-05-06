package com.niclabs.erp.audit.service;

import com.niclabs.erp.audit.domain.AuditLog;
import com.niclabs.erp.audit.dto.AuditLogResponseDTO;
import com.niclabs.erp.audit.repository.AuditLogRepository;
import com.niclabs.erp.auth.domain.User;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditService implements IAuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final AuditLogRepository auditLogRepository;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(String action, String module, String entityType, UUID entityId, String summary, String details) {
        try {
            AuditLog auditLog = new AuditLog();
            auditLog.setId(UUID.randomUUID());
            auditLog.setOccurredAt(LocalDateTime.now());
            applyActor(auditLog);
            auditLog.setAction(limit(action, 80));
            auditLog.setModule(limit(module, 80));
            auditLog.setEntityType(limit(entityType, 120));
            auditLog.setEntityId(entityId);
            auditLog.setSummary(limit(summary, 500));
            auditLog.setDetails(details);

            auditLogRepository.save(auditLog);
        } catch (Exception ex) {
            log.warn("Falha ao registrar auditoria: {}", ex.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogResponseDTO> findLogs(String search, String module, Pageable pageable) {
        String normalizedSearch = search == null ? "" : search.trim();
        String normalizedModule = module == null || module.isBlank() ? null : module.trim();
        return auditLogRepository.search(normalizedSearch, normalizedModule, pageable)
                .map(AuditLogResponseDTO::fromEntity);
    }

    private void applyActor(AuditLog auditLog) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof User user)) {
            auditLog.setActorName("system");
            return;
        }
        auditLog.setActorId(user.getId());
        auditLog.setActorName(user.getName());
    }

    private String limit(String value, int maxLength) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.length() > maxLength ? trimmed.substring(0, maxLength) : trimmed;
    }
}
