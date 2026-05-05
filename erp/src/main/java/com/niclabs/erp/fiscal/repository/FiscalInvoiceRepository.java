package com.niclabs.erp.fiscal.repository;

import com.niclabs.erp.fiscal.domain.FiscalInvoice;
import com.niclabs.erp.fiscal.domain.FiscalInvoiceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface FiscalInvoiceRepository extends JpaRepository<FiscalInvoice, UUID> {

    Optional<FiscalInvoice> findBySupplierIdAndNumberAndSeries(UUID supplierId, String number, String series);

    @Query("""
            select i
            from FiscalInvoice i
            join i.supplier s
            where (:status is null or i.status = :status)
              and (
                lower(i.number) like lower(concat('%', :search, '%'))
                or lower(coalesce(i.series, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(i.accessKey, '')) like lower(concat('%', :search, '%'))
                or lower(s.legalName) like lower(concat('%', :search, '%'))
                or lower(coalesce(s.tradeName, '')) like lower(concat('%', :search, '%'))
                or lower(s.document) like lower(concat('%', :search, '%'))
              )
            """)
    Page<FiscalInvoice> search(@Param("search") String search,
                               @Param("status") FiscalInvoiceStatus status,
                               Pageable pageable);

    @Query("""
            select i
            from FiscalInvoice i
            where (:status is null or i.status = :status)
            """)
    Page<FiscalInvoice> findByOptionalStatus(@Param("status") FiscalInvoiceStatus status, Pageable pageable);
}
