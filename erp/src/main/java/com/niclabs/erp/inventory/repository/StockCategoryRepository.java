package com.niclabs.erp.inventory.repository;

import com.niclabs.erp.inventory.domain.StockCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StockCategoryRepository extends JpaRepository<StockCategory, UUID> {

    List<StockCategory> findAllByOrderByNameAsc();

    List<StockCategory> findByActiveOrderByNameAsc(boolean active);

    Optional<StockCategory> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);
}
