package com.niclabs.erp.inventory.repository;

import com.niclabs.erp.inventory.domain.ITAsset;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.UUID;

public interface ITAssetRepository extends JpaRepository<ITAsset, UUID> {

    // Conta os ativos de TI por status (Disponível, Em Uso, etc)
    long countByStatus(com.niclabs.erp.inventory.domain.AssetStatus status);

    @Query("""
            select a
            from ITAsset a
            left join User u on u.id = a.assignedTo
            where lower(a.assetTag) like lower(concat('%', :search, '%'))
               or lower(a.serialNumber) like lower(concat('%', :search, '%'))
               or lower(a.brand) like lower(concat('%', :search, '%'))
               or lower(a.model) like lower(concat('%', :search, '%'))
               or lower(coalesce(u.name, '')) like lower(concat('%', :search, '%'))
               or lower(coalesce(u.email, '')) like lower(concat('%', :search, '%'))
            """)
    Page<ITAsset> searchAssets(@Param("search") String search, Pageable pageable);
}
