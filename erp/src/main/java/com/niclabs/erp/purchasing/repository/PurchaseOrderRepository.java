package com.niclabs.erp.purchasing.repository;

import com.niclabs.erp.purchasing.domain.PurchaseOrder;
import com.niclabs.erp.purchasing.domain.PurchaseOrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, UUID> {

    Optional<PurchaseOrder> findByNumber(String number);

    @Query("""
            select o
            from PurchaseOrder o
            join o.supplier s
            where (:status is null or o.status = :status)
              and (
                lower(o.number) like lower(concat('%', :search, '%'))
                or lower(coalesce(o.notes, '')) like lower(concat('%', :search, '%'))
                or lower(s.legalName) like lower(concat('%', :search, '%'))
                or lower(coalesce(s.tradeName, '')) like lower(concat('%', :search, '%'))
              )
            """)
    Page<PurchaseOrder> search(@Param("search") String search,
                               @Param("status") PurchaseOrderStatus status,
                               Pageable pageable);

    @Query("""
            select o
            from PurchaseOrder o
            where (:status is null or o.status = :status)
            """)
    Page<PurchaseOrder> findByOptionalStatus(@Param("status") PurchaseOrderStatus status, Pageable pageable);
}
