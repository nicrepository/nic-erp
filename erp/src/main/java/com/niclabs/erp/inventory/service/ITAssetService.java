package com.niclabs.erp.inventory.service;

import com.niclabs.erp.inventory.domain.AssetStatus;
import com.niclabs.erp.inventory.domain.ITAsset;
import com.niclabs.erp.inventory.dto.ITAssetDTO;
import com.niclabs.erp.inventory.repository.ITAssetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ITAssetService {

    private final ITAssetRepository assetRepository;

    @Transactional
    public ITAsset registerAsset(ITAssetDTO dto) {
        ITAsset asset = new ITAsset();
        asset.setId(UUID.randomUUID());
        asset.setSerialNumber(dto.serialNumber());
        asset.setAssetTag(dto.assetTag());
        asset.setModel(dto.model());
        asset.setBrand(dto.brand());
        asset.setStatus(AssetStatus.AVAILABLE); // Todo equipamento novo entra como DISPONÍVEL

        return assetRepository.save(asset);
    }
}
