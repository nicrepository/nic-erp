package com.niclabs.erp.inventory.service;

import com.niclabs.erp.inventory.domain.InventoryMovement;
import com.niclabs.erp.inventory.dto.StockCategoryDTO;
import com.niclabs.erp.inventory.dto.StockCategoryResponseDTO;
import com.niclabs.erp.inventory.dto.StockItemDTO;
import com.niclabs.erp.inventory.dto.StockItemResponseDTO;
import com.niclabs.erp.inventory.dto.StockUnitOfMeasureDTO;
import com.niclabs.erp.inventory.dto.StockUnitOfMeasureResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Contract for administrative stock (consumables and supplies) lifecycle management.
 *
 * <p>Every stock quantity change (add/remove) is automatically recorded as an
 * {@link InventoryMovement} for full audit traceability.</p>
 */
public interface IStockItemService {

    /**
     * Registers a new stock item with zero initial quantity.
     *
     * @param dto item creation payload
     * @return the persisted item summary
     */
    StockItemResponseDTO createItem(StockItemDTO dto);

    /**
     * Adds stock to an existing item and records the inbound movement.
     *
     * @param itemId   target item identifier
     * @param quantity positive quantity to add
     * @throws com.niclabs.erp.exception.ResourceNotFoundException if the item does not exist
     */
    void addStock(UUID itemId, Integer quantity);

    void addStockFromFiscal(UUID itemId, Integer quantity, BigDecimal unitValue, UUID invoiceId, String originDescription);

    /**
     * Removes stock from an existing item and records the outbound movement.
     *
     * @param itemId   target item identifier
     * @param quantity positive quantity to remove
     * @throws com.niclabs.erp.exception.ResourceNotFoundException if the item does not exist
     * @throws com.niclabs.erp.exception.BusinessException         if available quantity is insufficient
     */
    void removeStock(UUID itemId, Integer quantity);

    /**
     * Soft-deletes a stock item. Historical movements linked to this item are preserved.
     *
     * @param itemId target item identifier
     * @throws com.niclabs.erp.exception.ResourceNotFoundException if the item does not exist
     */
    void deleteItem(UUID itemId);

    /**
     * Returns a paginated list of items whose current quantity is below their minimum stock threshold.
     *
     * @param pageable pagination and sorting parameters
     * @return page of low-stock items
     */
    Page<StockItemResponseDTO> findLowStockItems(Pageable pageable);

    /**
     * Returns a paginated list of all active (non-deleted) stock items.
     *
     * @param search optional search term matched against name and category
     * @param pageable pagination and sorting parameters
     * @return page of item summaries
     */
    Page<StockItemResponseDTO> findAllItems(String search, Pageable pageable);

    /**
     * Updates the metadata of an existing item. Quantity changes must go through
     * {@link #addStock} or {@link #removeStock} to maintain the audit trail.
     *
     * @param itemId target item identifier
     * @param dto    updated item payload
     * @return the updated item summary
     * @throws com.niclabs.erp.exception.ResourceNotFoundException if the item does not exist
     */
    StockItemResponseDTO updateItem(UUID itemId, StockItemDTO dto);

    /**
     * Returns a paginated audit trail of movements for a specific stock item.
     *
     * @param itemId   target item identifier
     * @param pageable pagination and sorting parameters
     * @return page of movements for the item
     */
    Page<InventoryMovement> findMovementsByItem(UUID itemId, Pageable pageable);

    /**
     * Returns a paginated list of all inventory movements across all items.
     *
     * @param search optional search term matched against material and user data
     * @param pageable pagination and sorting parameters
     * @return page of all movements
     */
    Page<InventoryMovement> findAllMovements(String search, Pageable pageable);

    List<StockCategoryResponseDTO> findAllCategories();

    List<StockCategoryResponseDTO> findActiveCategories();

    StockCategoryResponseDTO createCategory(StockCategoryDTO dto);

    StockCategoryResponseDTO updateCategory(UUID categoryId, StockCategoryDTO dto);

    void deleteCategory(UUID categoryId);

    List<StockUnitOfMeasureResponseDTO> findAllUnits();

    List<StockUnitOfMeasureResponseDTO> findActiveUnits();

    StockUnitOfMeasureResponseDTO createUnit(StockUnitOfMeasureDTO dto);

    StockUnitOfMeasureResponseDTO updateUnit(UUID unitId, StockUnitOfMeasureDTO dto);

    void deleteUnit(UUID unitId);
}
