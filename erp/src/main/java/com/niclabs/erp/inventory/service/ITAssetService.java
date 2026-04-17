
package com.niclabs.erp.inventory.service;

import com.niclabs.erp.inventory.domain.AssetAction;
import com.niclabs.erp.inventory.domain.AssetStatus;
import com.niclabs.erp.inventory.domain.ITAsset;
import com.niclabs.erp.inventory.domain.ITAssetHistory;
import com.niclabs.erp.auth.domain.User;
import com.niclabs.erp.common.SecurityUtils;
import com.niclabs.erp.inventory.dto.ITAssetDTO;
import com.niclabs.erp.inventory.dto.ITAssetResponseDTO;
import com.niclabs.erp.inventory.dto.ITAssetHistoryResponseDTO;
import com.niclabs.erp.inventory.repository.ITAssetHistoryRepository;
import com.niclabs.erp.inventory.repository.ITAssetRepository;
import com.niclabs.erp.exception.BusinessException;
import com.niclabs.erp.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Manages the IT asset inventory: registration, user assignment, write-offs, and audit history.
 *
 * <p>Write operations are wrapped in {@code @Transactional}. Read operations use
 * {@code readOnly = true} to skip dirty checking and optimise connection pool usage.</p>
 */
@Service
@RequiredArgsConstructor
public class ITAssetService implements IITAssetService {

    private final ITAssetRepository assetRepository;
    private final ITAssetHistoryRepository historyRepository;

    private void recordAssetHistory(UUID assetId, AssetAction action, UUID assignedToUser) {
        User loggedInUser = SecurityUtils.getCurrentUser();

        ITAssetHistory history = new ITAssetHistory();
        history.setId(UUID.randomUUID());
        history.setAssetId(assetId);
        history.setAction(action);
        history.setPerformedBy(loggedInUser.getId());
        history.setAssignedToUser(assignedToUser);

        historyRepository.save(history);
    }

    /**
     * Returns the full audit history for an asset, most recent action first.
     *
     * @param assetId asset identifier
     * @return list of {@link ITAssetHistoryResponseDTO}
     */
    @Transactional(readOnly = true)
    public List<ITAssetHistoryResponseDTO> getAssetHistory(UUID assetId) {
        return historyRepository.findByAssetIdOrderByCreatedAtDesc(assetId).stream()
                .map(this::mapHistoryToDTO)
                .toList();
    }

    // ==========================================
    // OPERAÇÕES DO EQUIPAMENTO
    // ==========================================

    /**
     * Registers a new IT asset with {@code AVAILABLE} status and creates its initial history entry.
     *
     * @param dto asset data including serial number, tag, model, and brand
     * @return the created {@link ITAssetResponseDTO}
     */
    @Transactional
    public ITAssetResponseDTO registerAsset(ITAssetDTO dto) {
        ITAsset asset = new ITAsset();
        asset.setId(UUID.randomUUID());
        asset.setSerialNumber(dto.serialNumber());
        asset.setAssetTag(dto.assetTag());
        asset.setModel(dto.model());
        asset.setBrand(dto.brand());
        asset.setDetails(dto.details());
        asset.setStatus(AssetStatus.AVAILABLE);

        ITAsset savedAsset = assetRepository.save(asset);
        recordAssetHistory(savedAsset.getId(), AssetAction.CREATED, null);

        return mapAssetToDTO(savedAsset);
    }

    /**
     * Returns all IT assets regardless of status.
     *
     * @return list of {@link ITAssetResponseDTO}
     */
    @Transactional(readOnly = true)
    public List<ITAssetResponseDTO> findAllAssets() {
        return assetRepository.findAll().stream()
                .map(this::mapAssetToDTO)
                .toList();
    }

    /**
     * Assigns an available asset to a user and records the assignment in the asset history.
     *
     * @param assetId asset identifier
     * @param userId  target user identifier
     * @return updated {@link ITAssetResponseDTO}
     * @throws BusinessException         if the asset is not in {@code AVAILABLE} status
     * @throws ResourceNotFoundException if the asset does not exist
     */
    @Transactional
    public ITAssetResponseDTO assignAssetToUser(UUID assetId, UUID userId) {
        ITAsset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new ResourceNotFoundException("Ativo de TI não encontrado."));

        if (asset.getStatus() != AssetStatus.AVAILABLE) {
            throw new BusinessException("Este equipamento não está disponível para atribuição. Status atual: " + asset.getStatus());
        }

        asset.setStatus(AssetStatus.IN_USE);
        asset.setAssignedTo(userId);

        ITAsset savedAsset = assetRepository.save(asset);
        recordAssetHistory(savedAsset.getId(), AssetAction.ASSIGNED, userId);

        return mapAssetToDTO(savedAsset);
    }

    /**
     * Removes the user assignment from an asset and sets its status back to {@code AVAILABLE}.
     *
     * @param assetId asset identifier
     * @return updated {@link ITAssetResponseDTO}
     * @throws ResourceNotFoundException if the asset does not exist
     */
    @Transactional
    public ITAssetResponseDTO unassignAsset(UUID assetId) {
        ITAsset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new ResourceNotFoundException("Equipamento não encontrado"));

        asset.setAssignedTo(null);
        asset.setStatus(AssetStatus.AVAILABLE);

        ITAsset savedAsset = assetRepository.save(asset);
        recordAssetHistory(savedAsset.getId(), AssetAction.UNASSIGNED, null);

        return mapAssetToDTO(savedAsset);
    }

    /**
     * Updates the descriptive fields of an existing asset and appends an {@code UPDATED} history entry.
     *
     * @param assetId asset identifier
     * @param dto     new asset data
     * @return updated {@link ITAssetResponseDTO}
     * @throws ResourceNotFoundException if the asset does not exist
     */
    @Transactional
    public ITAssetResponseDTO updateAsset(UUID assetId, ITAssetDTO dto) {
        ITAsset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new ResourceNotFoundException("Equipamento não encontrado"));

        asset.setSerialNumber(dto.serialNumber());
        asset.setAssetTag(dto.assetTag());
        asset.setModel(dto.model());
        asset.setBrand(dto.brand());
        asset.setDetails(dto.details());

        ITAsset savedAsset = assetRepository.save(asset);
        recordAssetHistory(savedAsset.getId(), AssetAction.UPDATED, savedAsset.getAssignedTo());

        return mapAssetToDTO(savedAsset);
    }

    /**
     * Marks an asset as {@code WRITTEN_OFF}, appending the reason to its details and recording the action in history.
     *
     * @param id     asset identifier
     * @param reason human-readable justification for the write-off
     * @throws BusinessException         if the asset still has a user assigned
     * @throws ResourceNotFoundException if the asset does not exist
     */
    @Transactional
    public void writeOffAsset(UUID id, String reason) {
        ITAsset asset = assetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ativo não encontrado."));

        if (asset.getAssignedTo() != null) {
            throw new BusinessException("Desvincule o usuário antes de dar baixa neste equipamento.");
        }

        asset.setStatus(AssetStatus.WRITTEN_OFF);
        String currentDetails = asset.getDetails() != null ? asset.getDetails() : "";
        asset.setDetails(currentDetails + "\n\n[BAIXA EM " + java.time.LocalDate.now() + "]: " + reason);
        assetRepository.save(asset);

        recordAssetHistory(asset.getId(), AssetAction.WRITTEN_OFF, null);
    }

    private ITAssetResponseDTO mapAssetToDTO(ITAsset asset) {
        return new ITAssetResponseDTO(
                asset.getId(),
                asset.getSerialNumber(),
                asset.getAssetTag(),
                asset.getModel(),
                asset.getBrand(),
                asset.getDetails(),
                asset.getStatus(),
                asset.getAssignedTo()
        );
    }

    private ITAssetHistoryResponseDTO mapHistoryToDTO(ITAssetHistory history) {
        return new ITAssetHistoryResponseDTO(
                history.getId(),
                history.getAssetId(),
                history.getAction(),
                history.getPerformedBy(),
                history.getAssignedToUser(),
                history.getCreatedAt()
        );
    }
}