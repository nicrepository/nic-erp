package com.niclabs.erp.inventory.repository;

import com.niclabs.erp.inventory.domain.StockItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.UUID;

public interface StockItemRepository extends JpaRepository<StockItem, UUID> {

    @Query("SELECT COUNT(s) FROM StockItem s WHERE s.quantity <= s.minimumStock")
    long countLowStockItems();

    @Query("SELECT s FROM StockItem s WHERE s.quantity <= s.minimumStock ORDER BY s.quantity ASC")
    Page<StockItem> findLowStockItems(Pageable pageable);
}
