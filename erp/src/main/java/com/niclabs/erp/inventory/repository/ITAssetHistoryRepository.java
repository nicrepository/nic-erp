package com.niclabs.erp.inventory.repository;

import com.niclabs.erp.inventory.domain.ITAssetHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ITAssetHistoryRepository extends JpaRepository<ITAssetHistory, UUID> {
    // Busca todo o histórico de um equipamento específico, do mais novo pro mais velho
    List<ITAssetHistory> findByAssetIdOrderByCreatedAtDesc(UUID assetId);
}