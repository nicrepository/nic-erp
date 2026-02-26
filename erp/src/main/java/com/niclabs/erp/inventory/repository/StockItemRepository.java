package com.niclabs.erp.inventory.repository;

import com.niclabs.erp.inventory.domain.StockItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface StockItemRepository extends JpaRepository<StockItem, UUID> {

    // Uma query personalizada para descobrir quantos itens estão com estoque no limite ou abaixo do mínimo
    @org.springframework.data.jpa.repository.Query("SELECT COUNT(s) FROM StockItem s WHERE s.quantity <= s.minimumStock")
    long countLowStockItems();

}
