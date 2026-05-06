package com.niclabs.erp.audit.dto;

import com.niclabs.erp.audit.domain.AuditLog;

import java.time.LocalDateTime;
import java.util.UUID;

public record AuditLogResponseDTO(
        UUID id,
        LocalDateTime occurredAt,
        UUID actorId,
        String actorName,
        String action,
        String module,
        String entityType,
        UUID entityId,
        String summary,
        String details
) {
    public static AuditLogResponseDTO fromEntity(AuditLog log) {
        return new AuditLogResponseDTO(
                log.getId(),
                log.getOccurredAt(),
                log.getActorId(),
                log.getActorName(),
                log.getAction(),
                log.getModule(),
                log.getEntityType(),
                log.getEntityId(),
                log.getSummary(),
                log.getDetails()
        );
    }
}
