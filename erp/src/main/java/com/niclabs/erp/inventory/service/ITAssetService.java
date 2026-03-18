package com.niclabs.erp.inventory.service;

import com.niclabs.erp.auth.domain.User;
import com.niclabs.erp.inventory.domain.AssetAction;
import com.niclabs.erp.inventory.domain.AssetStatus;
import com.niclabs.erp.inventory.domain.ITAsset;
import com.niclabs.erp.inventory.domain.ITAssetHistory;
import com.niclabs.erp.inventory.dto.ITAssetDTO;
import com.niclabs.erp.inventory.repository.ITAssetHistoryRepository;
import com.niclabs.erp.inventory.repository.ITAssetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.niclabs.erp.auth.repository.UserRepository;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ITAssetService {

    private final ITAssetRepository assetRepository;
    private final ITAssetHistoryRepository historyRepository;
    private final UserRepository userRepository;

    // ==========================================
    // MÉTODO PRIVADO DE AUDITORIA
    // ==========================================
    private void recordAssetHistory(UUID assetId, AssetAction action, UUID assignedToUser) {
        // Pega o usuário logado (geralmente você, da TI)
        User loggedInUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        ITAssetHistory history = new ITAssetHistory();
        history.setId(UUID.randomUUID());
        history.setAssetId(assetId);
        history.setAction(action);
        history.setPerformedBy(loggedInUser.getId());
        history.setAssignedToUser(assignedToUser);

        historyRepository.save(history);
    }

    // ==========================================
    // MÉTODO PARA BUSCAR O HISTÓRICO
    // ==========================================
    public List<ITAssetHistory> getAssetHistory(UUID assetId) {
        return historyRepository.findByAssetIdOrderByCreatedAtDesc(assetId);
    }

    // ==========================================
    // OPERAÇÕES DO EQUIPAMENTO
    // ==========================================

    @Transactional
    public ITAsset registerAsset(ITAssetDTO dto) {
        ITAsset asset = new ITAsset();
        asset.setId(UUID.randomUUID());
        asset.setSerialNumber(dto.serialNumber());
        asset.setAssetTag(dto.assetTag());
        asset.setModel(dto.model());
        asset.setBrand(dto.brand());
        asset.setDetails(dto.details());
        asset.setStatus(AssetStatus.AVAILABLE);

        ITAsset savedAsset = assetRepository.save(asset);

        // --- AUDITORIA ---
        recordAssetHistory(savedAsset.getId(), AssetAction.CREATED, null);

        return savedAsset;
    }

    public List<ITAsset> findAllAssets() {
        return assetRepository.findAll();
    }

    @Transactional
    public ITAsset assignAssetToUser(UUID assetId, UUID userId) {
        ITAsset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new RuntimeException("Ativo de TI não encontrado."));

        if (asset.getStatus() != AssetStatus.AVAILABLE) {
            throw new RuntimeException("Este equipamento não está disponível para atribuição. Status atual: " + asset.getStatus());
        }

        asset.setStatus(AssetStatus.IN_USE);
        asset.setAssignedTo(userId);

        ITAsset savedAsset = assetRepository.save(asset);

        // --- AUDITORIA ---
        recordAssetHistory(savedAsset.getId(), AssetAction.ASSIGNED, userId);

        return savedAsset;
    }

    @Transactional
    public ITAsset unassignAsset(UUID assetId) {
        ITAsset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new RuntimeException("Equipamento não encontrado"));

        asset.setAssignedTo(null);
        asset.setStatus(AssetStatus.AVAILABLE);

        ITAsset savedAsset = assetRepository.save(asset);

        // --- AUDITORIA ---
        recordAssetHistory(savedAsset.getId(), AssetAction.UNASSIGNED, null);

        return savedAsset;
    }

    @Transactional
    public ITAsset updateAsset(UUID assetId, ITAssetDTO dto) {
        ITAsset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new RuntimeException("Equipamento não encontrado"));

        asset.setSerialNumber(dto.serialNumber());
        asset.setAssetTag(dto.assetTag());
        asset.setModel(dto.model());
        asset.setBrand(dto.brand());
        asset.setDetails(dto.details());

        ITAsset savedAsset = assetRepository.save(asset);

        // --- AUDITORIA ---
        recordAssetHistory(savedAsset.getId(), AssetAction.UPDATED, savedAsset.getAssignedTo());

        return savedAsset;
    }

    @Transactional
    public void writeOffAsset(UUID id, String reason) {
        ITAsset asset = assetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ativo não encontrado."));

        if (asset.getAssignedTo() != null) {
            throw new RuntimeException("Desvincule o usuário antes de dar baixa neste equipamento.");
        }

        // 1. Muda o status para BAIXADO e grava o motivo
        asset.setStatus(AssetStatus.WRITTEN_OFF);
        String currentDetails = asset.getDetails() != null ? asset.getDetails() : "";
        asset.setDetails(currentDetails + "\n\n[BAIXA EM " + java.time.LocalDate.now() + "]: " + reason);

        assetRepository.save(asset);

        // 2. Descobre quem é o usuário logado para a auditoria
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User loggedInUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Erro de segurança: Usuário não encontrado."));

        // 3. Grava a ação no Histórico
        ITAssetHistory history = new ITAssetHistory();
        history.setId(UUID.randomUUID());
        history.setAssetId(asset.getId());
        history.setAction(AssetAction.WRITTEN_OFF);
        history.setPerformedBy(loggedInUser.getId()); // ID real do usuário que clicou no botão!

        historyRepository.save(history);
    }
}