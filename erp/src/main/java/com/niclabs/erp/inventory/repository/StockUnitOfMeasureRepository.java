package com.niclabs.erp.inventory.repository;

import com.niclabs.erp.inventory.domain.StockUnitOfMeasure;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StockUnitOfMeasureRepository extends JpaRepository<StockUnitOfMeasure, UUID> {

    List<StockUnitOfMeasure> findAllByOrderByNameAsc();

    List<StockUnitOfMeasure> findByActiveOrderByNameAsc(boolean active);

    Optional<StockUnitOfMeasure> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);
}
