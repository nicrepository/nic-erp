package com.niclabs.erp.inventory.repository;

import com.niclabs.erp.inventory.domain.InventoryMovement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, UUID> {

    Page<InventoryMovement> findByItemId(UUID itemId, Pageable pageable);
}
