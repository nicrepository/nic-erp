package com.niclabs.erp.inventory.repository;

import com.niclabs.erp.inventory.domain.ITAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface ITAssetRepository extends JpaRepository<ITAsset, UUID> {}
