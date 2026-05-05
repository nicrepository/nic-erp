package com.niclabs.erp.purchasing.repository;

import com.niclabs.erp.purchasing.domain.PurchaseRequest;
import com.niclabs.erp.purchasing.domain.PurchaseRequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface PurchaseRequestRepository extends JpaRepository<PurchaseRequest, UUID> {

    @Query("""
            select r
            from PurchaseRequest r
            where (:status is null or r.status = :status)
              and (
                lower(r.title) like lower(concat('%', :search, '%'))
                or lower(coalesce(r.costCenter, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(r.justification, '')) like lower(concat('%', :search, '%'))
              )
            """)
    Page<PurchaseRequest> search(@Param("search") String search,
                                 @Param("status") PurchaseRequestStatus status,
                                 Pageable pageable);

    @Query("""
            select r
            from PurchaseRequest r
            where (:status is null or r.status = :status)
            """)
    Page<PurchaseRequest> findByOptionalStatus(@Param("status") PurchaseRequestStatus status, Pageable pageable);
}
