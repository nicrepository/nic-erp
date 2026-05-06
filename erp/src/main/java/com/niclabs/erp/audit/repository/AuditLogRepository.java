package com.niclabs.erp.audit.repository;

import com.niclabs.erp.audit.domain.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    @Query("""
            SELECT l FROM AuditLog l
            WHERE (:module IS NULL OR l.module = :module)
              AND (:search = '' OR
                   LOWER(COALESCE(l.actorName, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(l.action, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(l.entityType, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(l.summary, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(l.details, '')) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<AuditLog> search(@Param("search") String search, @Param("module") String module, Pageable pageable);
}
