package com.niclabs.erp.inventory.repository;

import com.niclabs.erp.inventory.domain.StockItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface StockItemRepository extends JpaRepository<StockItem, UUID> {}
