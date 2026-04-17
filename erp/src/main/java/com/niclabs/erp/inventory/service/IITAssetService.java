package com.niclabs.erp.inventory.service;

import com.niclabs.erp.inventory.dto.ITAssetDTO;
import com.niclabs.erp.inventory.dto.ITAssetHistoryResponseDTO;
import com.niclabs.erp.inventory.dto.ITAssetResponseDTO;

import java.util.List;
import java.util.UUID;

/**
 * Contract for IT asset lifecycle management.
 *
 * <p>Every state transition on an asset (creation, assignment, unassignment,
 * update, write-off) is automatically recorded in the asset's audit history
 * to satisfy inventory control requirements.</p>
 */
public interface IITAssetService {

    /**
     * Returns the full audit history of an asset in reverse chronological order.
     *
     * @param assetId target asset identifier
     * @return list of history entries
     */
    List<ITAssetHistoryResponseDTO> getAssetHistory(UUID assetId);

    /**
     * Registers a new IT asset with {@code AVAILABLE} status.
     *
     * @param dto asset creation payload
     * @return the persisted asset summary
     */
    ITAssetResponseDTO registerAsset(ITAssetDTO dto);

    /**
     * Returns all registered IT assets regardless of their current status.
     *
     * @return list of all assets
     */
    List<ITAssetResponseDTO> findAllAssets();

    /**
     * Assigns an available asset to a user and records the operation in the audit history.
     *
     * @param assetId target asset identifier
     * @param userId  identifier of the user receiving the asset
     * @return updated asset summary
     * @throws com.niclabs.erp.exception.ResourceNotFoundException if the asset does not exist
     * @throws com.niclabs.erp.exception.BusinessException         if the asset is not in {@code AVAILABLE} status
     */
    ITAssetResponseDTO assignAssetToUser(UUID assetId, UUID userId);

    /**
     * Unassigns an asset from its current user and returns it to {@code AVAILABLE}.
     *
     * @param assetId target asset identifier
     * @return updated asset summary
     * @throws com.niclabs.erp.exception.ResourceNotFoundException if the asset does not exist
     */
    ITAssetResponseDTO unassignAsset(UUID assetId);

    /**
     * Updates the physical metadata of an asset (serial number, model, brand, details).
     *
     * @param assetId target asset identifier
     * @param dto     updated asset payload
     * @return updated asset summary
     * @throws com.niclabs.erp.exception.ResourceNotFoundException if the asset does not exist
     */
    ITAssetResponseDTO updateAsset(UUID assetId, ITAssetDTO dto);

    /**
     * Permanently decommissions an asset by setting its status to {@code WRITTEN_OFF}.
     * The reason is appended to the asset's details field for traceability.
     *
     * @param id     target asset identifier
     * @param reason description of why the asset is being written off
     * @throws com.niclabs.erp.exception.ResourceNotFoundException if the asset does not exist
     * @throws com.niclabs.erp.exception.BusinessException         if the asset still has an assigned user
     */
    void writeOffAsset(UUID id, String reason);
}
