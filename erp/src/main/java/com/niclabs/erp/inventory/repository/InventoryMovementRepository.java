package com.niclabs.erp.inventory.repository;

import com.niclabs.erp.inventory.domain.InventoryMovement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, UUID> {
}
