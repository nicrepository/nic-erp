package com.niclabs.erp.audit.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "audit_logs", schema = "audit")
@Getter
@Setter
@NoArgsConstructor
public class AuditLog {

    @Id
    private UUID id;

    @Column(name = "occurred_at", nullable = false)
    private LocalDateTime occurredAt;

    @Column(name = "actor_id")
    private UUID actorId;

    @Column(name = "actor_name")
    private String actorName;

    @Column(nullable = false)
    private String action;

    @Column(nullable = false)
    private String module;

    @Column(name = "entity_type")
    private String entityType;

    @Column(name = "entity_id")
    private UUID entityId;

    private String summary;

    @Column(columnDefinition = "TEXT")
    private String details;
}
