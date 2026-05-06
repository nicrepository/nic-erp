package com.niclabs.erp.inventory.service;

import com.niclabs.erp.auth.domain.User;
import com.niclabs.erp.audit.service.IAuditService;
import com.niclabs.erp.common.SecurityUtils;
import com.niclabs.erp.inventory.domain.InventoryMovement;
import com.niclabs.erp.inventory.domain.MovementType;
import com.niclabs.erp.inventory.domain.StockCategory;
import com.niclabs.erp.inventory.domain.StockItem;
import com.niclabs.erp.inventory.domain.StockUnitOfMeasure;
import com.niclabs.erp.inventory.dto.StockCategoryDTO;
import com.niclabs.erp.inventory.dto.StockCategoryResponseDTO;
import com.niclabs.erp.inventory.dto.StockItemDTO;
import com.niclabs.erp.inventory.dto.StockItemResponseDTO;
import com.niclabs.erp.inventory.dto.StockUnitOfMeasureDTO;
import com.niclabs.erp.inventory.dto.StockUnitOfMeasureResponseDTO;
import com.niclabs.erp.inventory.repository.InventoryMovementRepository;
import com.niclabs.erp.inventory.repository.StockCategoryRepository;
import com.niclabs.erp.inventory.repository.StockItemRepository;
import com.niclabs.erp.inventory.repository.StockUnitOfMeasureRepository;
import com.niclabs.erp.exception.BusinessException;
import com.niclabs.erp.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
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
    private final StockCategoryRepository categoryRepository;
    private final StockUnitOfMeasureRepository unitRepository;
    private final IAuditService auditService;

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
        item.setCategory(resolveActiveCategoryName(dto.category()));
        item.setQuantity(0);
        item.setMinimumStock(dto.minimumStock());
        item.setUnitValue(normalizeMoney(dto.unitValue()));
        item.setUnitOfMeasure(resolveActiveUnitName(dto.unitOfMeasure()));
        item.setNotes(dto.notes());

        StockItem saved = itemRepository.save(item);
        auditService.record("CREATE_STOCK_ITEM", "INVENTORY", "StockItem", saved.getId(), "Item de estoque criado", "name=" + saved.getName() + "; category=" + saved.getCategory());
        return mapToDTO(saved);
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
        recordMovement(item, quantity, MovementType.IN, null, null, null);
        auditService.record("ADD_STOCK", "INVENTORY", "StockItem", item.getId(), "Entrada de estoque registrada", "quantity=" + quantity + "; item=" + item.getName());
    }

    @Transactional
    public void addStockFromFiscal(UUID itemId, Integer quantity, BigDecimal unitValue, UUID invoiceId, String originDescription) {
        StockItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item não encontrado no estoque"));

        item.setUnitValue(normalizeMoney(unitValue));
        item.setQuantity(item.getQuantity() + quantity);
        itemRepository.save(item);
        recordMovement(item, quantity, MovementType.IN, "FISCAL_INVOICE", invoiceId, originDescription);
        auditService.record("ADD_STOCK_FROM_FISCAL", "INVENTORY", "StockItem", item.getId(), "Entrada fiscal registrada no estoque", "quantity=" + quantity + "; origin=" + originDescription);
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
        recordMovement(item, quantity, MovementType.OUT, null, null, null);
        auditService.record("REMOVE_STOCK", "INVENTORY", "StockItem", item.getId(), "Saída de estoque registrada", "quantity=" + quantity + "; item=" + item.getName());
    }

    // Método privado para automatizar o registro da auditoria
    private void recordMovement(StockItem item, Integer quantity, MovementType type, String originType, UUID originId, String originDescription) {
        User loggedInUser = SecurityUtils.getCurrentUser();
        BigDecimal unitValue = normalizeMoney(item.getUnitValue());
        InventoryMovement movement = new InventoryMovement();
        movement.setId(UUID.randomUUID());
        movement.setItemId(item.getId());
        movement.setType(type);
        movement.setQuantity(quantity);
        movement.setUnitValue(unitValue);
        movement.setTotalValue(unitValue.multiply(BigDecimal.valueOf(quantity)));
        movement.setPerformedBy(loggedInUser.getId());
        movement.setOriginType(originType);
        movement.setOriginId(originId);
        movement.setOriginDescription(originDescription);

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
        auditService.record("DELETE_STOCK_ITEM", "INVENTORY", "StockItem", item.getId(), "Item de estoque removido", "name=" + item.getName());
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
    public Page<StockItemResponseDTO> findAllItems(String search, Pageable pageable) {
        String normalizedSearch = search == null ? "" : search.trim();
        Page<StockItem> items = normalizedSearch.isBlank()
                ? itemRepository.findAll(pageable)
                : itemRepository.searchItems(normalizedSearch, pageable);

        return items
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
        item.setCategory(resolveActiveCategoryName(dto.category()));
        item.setMinimumStock(dto.minimumStock());
        item.setUnitValue(normalizeMoney(dto.unitValue()));
        item.setUnitOfMeasure(resolveActiveUnitName(dto.unitOfMeasure()));
        item.setNotes(dto.notes());

        StockItem saved = itemRepository.save(item);
        auditService.record("UPDATE_STOCK_ITEM", "INVENTORY", "StockItem", saved.getId(), "Item de estoque atualizado", "name=" + saved.getName() + "; category=" + saved.getCategory());
        return mapToDTO(saved);
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
    public Page<InventoryMovement> findAllMovements(String search, Pageable pageable) {
        String normalizedSearch = search == null ? "" : search.trim();
        return normalizedSearch.isBlank()
                ? movementRepository.findAll(pageable)
                : movementRepository.searchMovements(normalizedSearch, pageable);
    }

    @Transactional(readOnly = true)
    public List<StockCategoryResponseDTO> findAllCategories() {
        return categoryRepository.findAllByOrderByNameAsc().stream()
                .map(StockCategoryResponseDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StockCategoryResponseDTO> findActiveCategories() {
        return categoryRepository.findByActiveOrderByNameAsc(true).stream()
                .map(StockCategoryResponseDTO::fromEntity)
                .toList();
    }

    @Transactional
    public StockCategoryResponseDTO createCategory(StockCategoryDTO dto) {
        String name = normalizeCategoryName(dto.name());
        if (categoryRepository.existsByNameIgnoreCase(name)) {
            throw new BusinessException("Já existe uma categoria com este nome.");
        }

        StockCategory category = new StockCategory();
        category.setId(UUID.randomUUID());
        category.setName(name);
        category.setActive(dto.active() == null || dto.active());

        StockCategory saved = categoryRepository.save(category);
        auditService.record("CREATE_STOCK_CATEGORY", "INVENTORY", "StockCategory", saved.getId(), "Categoria de estoque criada", "name=" + saved.getName());
        return StockCategoryResponseDTO.fromEntity(saved);
    }

    @Transactional
    public StockCategoryResponseDTO updateCategory(UUID categoryId, StockCategoryDTO dto) {
        StockCategory category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada"));

        String name = normalizeCategoryName(dto.name());
        categoryRepository.findByNameIgnoreCase(name)
                .filter(existing -> !existing.getId().equals(categoryId))
                .ifPresent(existing -> {
                    throw new BusinessException("Já existe uma categoria com este nome.");
                });

        category.setName(name);
        if (dto.active() != null) {
            category.setActive(dto.active());
        }

        StockCategory saved = categoryRepository.save(category);
        auditService.record("UPDATE_STOCK_CATEGORY", "INVENTORY", "StockCategory", saved.getId(), "Categoria de estoque atualizada", "name=" + saved.getName() + "; active=" + saved.isActive());
        return StockCategoryResponseDTO.fromEntity(saved);
    }

    @Transactional
    public void deleteCategory(UUID categoryId) {
        StockCategory category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada"));

        category.setActive(false);
        categoryRepository.save(category);
        auditService.record("DEACTIVATE_STOCK_CATEGORY", "INVENTORY", "StockCategory", category.getId(), "Categoria de estoque desativada", "name=" + category.getName());
    }

    private StockItemResponseDTO mapToDTO(StockItem item) {
        BigDecimal unitValue = normalizeMoney(item.getUnitValue());
        return new StockItemResponseDTO(
                item.getId(),
                item.getName(),
                item.getCategory(),
                item.getQuantity(),
                item.getMinimumStock(),
                unitValue,
                unitValue.multiply(BigDecimal.valueOf(item.getQuantity())),
                item.getUnitOfMeasure(),
                item.getNotes()
        );
    }

    private String resolveActiveUnitName(String unitName) {
        if (unitName == null || unitName.isBlank()) return null;
        String normalized = unitName.trim();
        StockUnitOfMeasure unit = unitRepository.findByNameIgnoreCase(normalized)
                .filter(StockUnitOfMeasure::isActive)
                .orElseThrow(() -> new BusinessException("Selecione uma unidade de medida ativa cadastrada."));
        return unit.getName();
    }

    private String resolveActiveCategoryName(String categoryName) {
        String normalized = normalizeCategoryName(categoryName);
        StockCategory category = categoryRepository.findByNameIgnoreCase(normalized)
                .filter(StockCategory::isActive)
                .orElseThrow(() -> new BusinessException("Selecione uma categoria ativa cadastrada."));

        return category.getName();
    }

    private String normalizeCategoryName(String categoryName) {
        return categoryName == null ? "" : categoryName.trim();
    }

    private BigDecimal normalizeMoney(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    // ---- Units of Measure CRUD ----

    @Transactional(readOnly = true)
    public List<StockUnitOfMeasureResponseDTO> findAllUnits() {
        return unitRepository.findAllByOrderByNameAsc().stream()
                .map(StockUnitOfMeasureResponseDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StockUnitOfMeasureResponseDTO> findActiveUnits() {
        return unitRepository.findByActiveOrderByNameAsc(true).stream()
                .map(StockUnitOfMeasureResponseDTO::fromEntity)
                .toList();
    }

    @Transactional
    public StockUnitOfMeasureResponseDTO createUnit(StockUnitOfMeasureDTO dto) {
        String name = dto.name().trim();
        if (unitRepository.existsByNameIgnoreCase(name)) {
            throw new BusinessException("Já existe uma unidade de medida com este nome.");
        }
        StockUnitOfMeasure unit = new StockUnitOfMeasure();
        unit.setId(UUID.randomUUID());
        unit.setName(name);
        unit.setActive(true);
        return StockUnitOfMeasureResponseDTO.fromEntity(unitRepository.save(unit));
    }

    @Transactional
    public StockUnitOfMeasureResponseDTO updateUnit(UUID unitId, StockUnitOfMeasureDTO dto) {
        StockUnitOfMeasure unit = unitRepository.findById(unitId)
                .orElseThrow(() -> new ResourceNotFoundException("Unidade de medida não encontrada"));
        if (dto.name() != null) unit.setName(dto.name().trim());
        if (dto.active() != null) unit.setActive(dto.active());
        return StockUnitOfMeasureResponseDTO.fromEntity(unitRepository.save(unit));
    }

    @Transactional
    public void deleteUnit(UUID unitId) {
        StockUnitOfMeasure unit = unitRepository.findById(unitId)
                .orElseThrow(() -> new ResourceNotFoundException("Unidade de medida não encontrada"));
        unit.setActive(false);
        unitRepository.save(unit);
    }
}
