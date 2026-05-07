package com.niclabs.erp.inventory.repository;

import com.niclabs.erp.inventory.domain.InventoryMovement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, UUID> {

    Page<InventoryMovement> findByItemId(UUID itemId, Pageable pageable);

    @Query("""
            select m
            from InventoryMovement m
            left join StockItem s on s.id = m.itemId
            left join User u on u.id = m.performedBy
            where lower(coalesce(s.name, '')) like lower(concat('%', :search, '%'))
               or lower(coalesce(s.category, '')) like lower(concat('%', :search, '%'))
               or lower(coalesce(u.name, '')) like lower(concat('%', :search, '%'))
               or lower(coalesce(u.email, '')) like lower(concat('%', :search, '%'))
               or lower(str(m.type)) like lower(concat('%', :search, '%'))
            """)
    Page<InventoryMovement> searchMovements(@Param("search") String search, Pageable pageable);
}
