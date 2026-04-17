package com.niclabs.erp.inventory.service;

import com.niclabs.erp.auth.domain.User;
import com.niclabs.erp.common.SecurityUtils;
import com.niclabs.erp.inventory.domain.InventoryMovement;
import com.niclabs.erp.inventory.domain.MovementType;
import com.niclabs.erp.inventory.domain.StockItem;
import com.niclabs.erp.inventory.dto.StockItemDTO;
import com.niclabs.erp.inventory.dto.StockItemResponseDTO;
import com.niclabs.erp.inventory.repository.InventoryMovementRepository;
import com.niclabs.erp.inventory.repository.StockItemRepository;
import com.niclabs.erp.exception.BusinessException;
import com.niclabs.erp.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Manages the administrative stock: item registration, stock movements, and low-stock monitoring.
 *
 * <p>Write operations are wrapped in {@code @Transactional}. Read operations use
 * {@code readOnly = true} to skip dirty checking and optimise connection pool usage.</p>
 */
@Service
@RequiredArgsConstructor
public class StockItemService implements IStockItemService {

    private final StockItemRepository itemRepository;
    private final InventoryMovementRepository movementRepository;

    /**
     * Registers a new stock item with an initial quantity of zero.
     *
     * @param dto item data including name, category, and minimum stock threshold
     * @return the created {@link StockItemResponseDTO}
     */
    @Transactional
    public StockItemResponseDTO createItem(StockItemDTO dto) {
        StockItem item = new StockItem();
        item.setId(UUID.randomUUID());
        item.setName(dto.name());
        item.setCategory(dto.category());
        item.setQuantity(0);
        item.setMinimumStock(dto.minimumStock());

        return mapToDTO(itemRepository.save(item));
    }

    /**
     * Increases the stock quantity of an item and records an {@code IN} movement for auditing.
     *
     * @param itemId   stock item identifier
     * @param quantity amount to add (must be positive)
     * @throws ResourceNotFoundException if the item does not exist
     */
    @Transactional
    public void addStock(UUID itemId, Integer quantity) {
        StockItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item não encontrado no estoque"));

        item.setQuantity(item.getQuantity() + quantity);
        itemRepository.save(item);
        recordMovement(itemId, quantity, MovementType.IN);
    }

    /**
     * Decreases the stock quantity of an item and records an {@code OUT} movement for auditing.
     *
     * @param itemId   stock item identifier
     * @param quantity amount to remove (must not exceed current stock)
     * @throws BusinessException         if there is insufficient stock
     * @throws ResourceNotFoundException if the item does not exist
     */
    @Transactional
    public void removeStock(UUID itemId, Integer quantity) {
        StockItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item não encontrado no estoque"));

        if (item.getQuantity() < quantity) {
            throw new BusinessException("Quantidade insuficiente em estoque!");
        }

        item.setQuantity(item.getQuantity() - quantity);
        itemRepository.save(item);
        recordMovement(itemId, quantity, MovementType.OUT);
    }

    // Método privado para automatizar o registro da auditoria
    private void recordMovement(UUID itemId, Integer quantity, MovementType type) {
        User loggedInUser = SecurityUtils.getCurrentUser();
        InventoryMovement movement = new InventoryMovement();
        movement.setId(UUID.randomUUID());
        movement.setItemId(itemId);
        movement.setType(type);
        movement.setQuantity(quantity);
        movement.setPerformedBy(loggedInUser.getId());

        movementRepository.save(movement);
    }

    /**
     * Permanently removes a stock item and its associated movement history.
     *
     * @param itemId stock item identifier
     * @throws ResourceNotFoundException if the item does not exist
     */
    @Transactional
    public void deleteItem(UUID itemId) {
        StockItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item não encontrado no estoque"));
        itemRepository.delete(item);
    }

    /**
     * Returns a paginated list of items whose current quantity is at or below the minimum stock threshold.
     *
     * @param pageable pagination and sort parameters
     * @return page of {@link StockItemResponseDTO} for low-stock items
     */
    @Transactional(readOnly = true)
    public Page<StockItemResponseDTO> findLowStockItems(Pageable pageable) {
        return itemRepository.findLowStockItems(pageable)
                .map(this::mapToDTO);
    }

    /**
     * Returns a paginated list of all stock items.
     *
     * @param pageable pagination and sort parameters
     * @return page of {@link StockItemResponseDTO}
     */
    @Transactional(readOnly = true)
    public Page<StockItemResponseDTO> findAllItems(Pageable pageable) {
        return itemRepository.findAll(pageable)
                .map(this::mapToDTO);
    }

    /**
     * Updates the descriptive fields and minimum stock threshold of an existing item.
     *
     * @param itemId stock item identifier
     * @param dto    updated item data
     * @return updated {@link StockItemResponseDTO}
     * @throws ResourceNotFoundException if the item does not exist
     */
    @Transactional
    public StockItemResponseDTO updateItem(UUID itemId, StockItemDTO dto) {
        StockItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item não encontrado no estoque"));

        item.setName(dto.name());
        item.setCategory(dto.category());
        item.setMinimumStock(dto.minimumStock());

        return mapToDTO(itemRepository.save(item));
    }

    /**
     * Returns a paginated movement history for a specific stock item.
     *
     * @param itemId   stock item identifier
     * @param pageable pagination and sort parameters
     * @return page of {@link InventoryMovement}
     */
    @Transactional(readOnly = true)
    public Page<InventoryMovement> findMovementsByItem(UUID itemId, Pageable pageable) {
        return movementRepository.findByItemId(itemId, pageable);
    }

    /**
     * Returns a paginated list of all inventory movements across all items.
     *
     * @param pageable pagination and sort parameters
     * @return page of {@link InventoryMovement}
     */
    @Transactional(readOnly = true)
    public Page<InventoryMovement> findAllMovements(Pageable pageable) {
        return movementRepository.findAll(pageable);
    }

    private StockItemResponseDTO mapToDTO(StockItem item) {
        return new StockItemResponseDTO(
                item.getId(),
                item.getName(),
                item.getCategory(),
                item.getQuantity(),
                item.getMinimumStock()
        );
    }
}
