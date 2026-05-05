package com.niclabs.erp.fiscal.repository;

import com.niclabs.erp.fiscal.domain.Supplier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface SupplierRepository extends JpaRepository<Supplier, UUID> {

    Optional<Supplier> findByDocument(String document);

    @Query("""
            select s
            from Supplier s
            where lower(s.legalName) like lower(concat('%', :search, '%'))
               or lower(coalesce(s.tradeName, '')) like lower(concat('%', :search, '%'))
               or lower(s.document) like lower(concat('%', :search, '%'))
               or lower(coalesce(s.category, '')) like lower(concat('%', :search, '%'))
            """)
    Page<Supplier> search(@Param("search") String search, Pageable pageable);
}
