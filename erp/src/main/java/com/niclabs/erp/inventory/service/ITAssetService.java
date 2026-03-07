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

    private final ITAssetRepository assetRepository; // <-- Nome correto da variável

    @Transactional
    public ITAsset registerAsset(ITAssetDTO dto) {
        ITAsset asset = new ITAsset();
        asset.setId(UUID.randomUUID());
        asset.setSerialNumber(dto.serialNumber());
        asset.setAssetTag(dto.assetTag());
        asset.setModel(dto.model());
        asset.setBrand(dto.brand());

        // Salvando o nosso novo campo de texto livre (observações/hardware)!
        asset.setDetails(dto.details());

        asset.setStatus(AssetStatus.AVAILABLE); // Todo equipamento novo entra como DISPONÍVEL

        return assetRepository.save(asset);
    }

    public java.util.List<ITAsset> findAllAssets() {
        return assetRepository.findAll();
    }

    @Transactional
    public ITAsset assignAssetToUser(UUID assetId, UUID userId) {
        ITAsset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new RuntimeException("Ativo de TI não encontrado."));

        if (asset.getStatus() != AssetStatus.AVAILABLE) {
            throw new RuntimeException("Este equipamento não está disponível para atribuição. Status atual: " + asset.getStatus());
        }

        // Muda o status para Em Uso e vincula ao ID do usuário
        asset.setStatus(AssetStatus.IN_USE);
        asset.setAssignedTo(userId);

        return assetRepository.save(asset);
    }

    // Função para desvincular o equipamento e devolvê-lo para a TI
    @Transactional
    public ITAsset unassignAsset(UUID assetId) {
        // Usando o nome correto: assetRepository
        ITAsset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new RuntimeException("Equipamento não encontrado"));

        asset.setAssignedTo(null); // Remove o dono
        asset.setStatus(AssetStatus.AVAILABLE); // Volta o status para Disponível

        return assetRepository.save(asset);
    }

    // Função para atualizar os dados do equipamento
    @Transactional
    public ITAsset updateAsset(UUID assetId, ITAssetDTO dto) {
        ITAsset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new RuntimeException("Equipamento não encontrado"));

        asset.setSerialNumber(dto.serialNumber());
        asset.setAssetTag(dto.assetTag());
        asset.setModel(dto.model());
        asset.setBrand(dto.brand());
        asset.setDetails(dto.details()); // Atualiza as especificações!

        return assetRepository.save(asset);
    }
}