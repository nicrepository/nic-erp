package com.niclabs.erp.inventory.controller;

import com.niclabs.erp.inventory.domain.InventoryMovement;
import com.niclabs.erp.inventory.dto.ITAssetDTO;
import com.niclabs.erp.inventory.dto.ITAssetResponseDTO;
import com.niclabs.erp.inventory.dto.ITAssetHistoryResponseDTO;
import com.niclabs.erp.inventory.dto.StockItemDTO;
import com.niclabs.erp.inventory.dto.StockItemResponseDTO;
import com.niclabs.erp.inventory.service.IITAssetService;
import com.niclabs.erp.inventory.service.IStockItemService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import java.util.List;
import java.util.UUID;

/**
 * REST controller for inventory management covering both administrative stock and IT assets.
 *
 * <p>Administrative stock tracks consumables and office supplies with quantity movements.
 * IT assets track hardware assigned to individual users. All state changes are recorded
 * in an audit trail for full traceability.</p>
 */
@org.springframework.web.bind.annotation.RestController
@RequestMapping("/inventory")
@RequiredArgsConstructor
@Tag(name = "Inventário", description = "Gestão de estoque administrativo e ativos de TI")
public class InventoryController {

    private final IStockItemService stockItemService;
    private final IITAssetService itAssetService;

    /**
     * Registers a new administrative stock item with zero initial quantity.
     *
     * @param dto item creation payload including name, unit, and minimum stock threshold
     * @return 201 Created with the persisted {@link StockItemResponseDTO}
     */
    @PreAuthorize("hasAuthority('ACCESS_INVENTORY_ADMIN') or hasAuthority('ROLE_ADMIN')")
    @PostMapping("/administrative/items")
    public ResponseEntity<StockItemResponseDTO> createStockItem(@Valid @RequestBody StockItemDTO dto) {
        StockItemResponseDTO created = stockItemService.createItem(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Records an inbound stock movement (entry) for an existing item.
     *
     * @param id       target item identifier
     * @param quantity positive quantity to add to the current stock
     * @return 200 OK with a confirmation message
     */
    @PreAuthorize("hasAuthority('ACCESS_INVENTORY_ADMIN') or hasAuthority('ROLE_ADMIN')")
    @PostMapping("/administrative/items/{id}/add")
    public ResponseEntity<String> addStock(@PathVariable UUID id, @RequestParam Integer quantity) {
        stockItemService.addStock(id, quantity);
        return ResponseEntity.ok("Entrada de estoque registrada com sucesso!");
    }

    /**
     * Records an outbound stock movement (withdrawal) for an existing item.
     *
     * @param id       target item identifier
     * @param quantity positive quantity to remove from the current stock
     * @return 200 OK with a confirmation message
     */
    @PreAuthorize("hasAuthority('ACCESS_INVENTORY_ADMIN') or hasAuthority('ROLE_ADMIN')")
    @PostMapping("/administrative/items/{id}/remove")
    public ResponseEntity<String> removeStock(@PathVariable UUID id, @RequestParam Integer quantity) {
        stockItemService.removeStock(id, quantity);
        return ResponseEntity.ok("Saída de estoque registrada com sucesso!");
    }

    /**
     * Retrieves a paginated list of all active administrative stock items.
     *
     * @param pageable pagination and sort parameters (default: page 0, size 20, sorted by name)
     * @return 200 OK with a page of {@link StockItemResponseDTO}
     */
    @PreAuthorize("hasAuthority('ACCESS_INVENTORY_ADMIN') or hasAuthority('ROLE_ADMIN')")
    @GetMapping("/administrative/items")
    public ResponseEntity<Page<StockItemResponseDTO>> getAllStockItems(@PageableDefault(size = 20, sort = "name") Pageable pageable) {
        return ResponseEntity.ok(stockItemService.findAllItems(pageable));
    }

    /**
     * Updates the metadata of an existing stock item (name, unit, minimum threshold).
     *
     * <p>Quantity changes must go through the add/remove endpoints to preserve the audit trail.</p>
     *
     * @param id  target item identifier
     * @param dto updated item payload
     * @return 200 OK with the updated {@link StockItemResponseDTO}
     */
    @PreAuthorize("hasAuthority('ACCESS_INVENTORY_ADMIN') or hasAuthority('ROLE_ADMIN')")
    @PutMapping("/administrative/items/{id}")
    public ResponseEntity<StockItemResponseDTO> updateStockItem(
            @PathVariable UUID id,
            @Valid @RequestBody StockItemDTO dto) {

        StockItemResponseDTO updatedItem = stockItemService.updateItem(id, dto);
        return ResponseEntity.ok(updatedItem);
    }

    // ==========================================
    // ESTOQUE DE TI
    // ==========================================

    /**
     * Registers a new IT asset with {@code AVAILABLE} status.
     *
     * @param dto asset creation payload including serial number, model, brand, and type
     * @return 201 Created with the persisted {@link ITAssetResponseDTO}
     */
    @PreAuthorize("hasAuthority('ACCESS_INVENTORY_IT') or hasAuthority('ROLE_ADMIN')")
    @PostMapping("/it/assets")
    public ResponseEntity<ITAssetResponseDTO> registerITAsset(@Valid @RequestBody ITAssetDTO dto) {
        ITAssetResponseDTO created = itAssetService.registerAsset(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Retrieves all IT assets regardless of their current status.
     *
     * @return 200 OK with the complete list of {@link ITAssetResponseDTO}
     */
    @PreAuthorize("hasAuthority('ACCESS_INVENTORY_IT') or hasAuthority('ROLE_ADMIN')")
    @GetMapping("/it/assets")
    public ResponseEntity<List<ITAssetResponseDTO>> getAllITAssets(){
        return ResponseEntity.ok(itAssetService.findAllAssets());
    }

    /**
     * Assigns an available IT asset to a user and records the operation in the audit history.
     *
     * @param id     target asset identifier
     * @param userId identifier of the user receiving the asset
     * @return 200 OK with the updated {@link ITAssetResponseDTO}
     */
    @PreAuthorize("hasAuthority('ACCESS_INVENTORY_IT') or hasAuthority('ROLE_ADMIN')")
    @PutMapping("/it/assets/{id}/assign")
    public ResponseEntity<ITAssetResponseDTO> assignAsset(
            @PathVariable UUID id,
            @RequestParam UUID userId) {

        ITAssetResponseDTO updatedAsset = itAssetService.assignAssetToUser(id, userId);
        return ResponseEntity.ok(updatedAsset);
    }

    /**
     * Unassigns an IT asset from its current user and returns it to {@code AVAILABLE} status.
     *
     * @param id target asset identifier
     * @return 200 OK with the updated {@link ITAssetResponseDTO}
     */
    @PreAuthorize("hasAuthority('ACCESS_INVENTORY_IT') or hasAuthority('ROLE_ADMIN')")
    @PutMapping("/it/assets/{id}/unassign")
    public ResponseEntity<ITAssetResponseDTO> unassignAsset(@PathVariable UUID id) {
        ITAssetResponseDTO updatedAsset = itAssetService.unassignAsset(id);
        return ResponseEntity.ok(updatedAsset);
    }

    /**
     * Updates the physical metadata of an IT asset (serial number, model, brand, details).
     *
     * @param id  target asset identifier
     * @param dto updated asset payload
     * @return 200 OK with the updated {@link ITAssetResponseDTO}
     */
    @PreAuthorize("hasAuthority('ACCESS_INVENTORY_IT') or hasAuthority('ROLE_ADMIN')")
    @PutMapping("/it/assets/{id}")
    public ResponseEntity<ITAssetResponseDTO> updateITAsset(
            @PathVariable UUID id,
            @Valid @RequestBody ITAssetDTO dto) {
        ITAssetResponseDTO updatedAsset = itAssetService.updateAsset(id, dto);
        return ResponseEntity.ok(updatedAsset);
    }

    /**
     * Retrieves the full audit history of an IT asset in reverse chronological order.
     *
     * @param id target asset identifier
     * @return 200 OK with the list of {@link ITAssetHistoryResponseDTO}
     */
    @PreAuthorize("hasAuthority('ACCESS_INVENTORY_IT') or hasAuthority('ROLE_ADMIN')")
    @GetMapping("/it/assets/{id}/history")
    public ResponseEntity<List<ITAssetHistoryResponseDTO>> getAssetHistory(@PathVariable UUID id) {
        return ResponseEntity.ok(itAssetService.getAssetHistory(id));
    }

    /**
     * Permanently decommissions an IT asset by setting its status to {@code WRITTEN_OFF}.
     *
     * @param id      target asset identifier
     * @param payload request body containing a {@code "reason"} key with the write-off justification
     * @return 200 OK when the asset has been written off
     */
    @PutMapping("/it/assets/{id}/write-off")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_TI')")
    public ResponseEntity<Void> writeOffITAsset(@PathVariable UUID id, @RequestBody java.util.Map<String, String> payload) {
        String reason = payload.get("reason");
        itAssetService.writeOffAsset(id, reason);
        return ResponseEntity.ok().build();
    }

    // ==========================================
    // AUDITORIA DE ESTOQUE
    // ==========================================
    /**
     * Soft-deletes a stock item. Historical movements linked to this item are preserved.
     *
     * @param id target item identifier
     * @return 204 No Content on success
     */
    @PreAuthorize("hasAuthority('ACCESS_INVENTORY_ADMIN') or hasAuthority('ROLE_ADMIN')")
    @DeleteMapping("/administrative/items/{id}")
    public ResponseEntity<Void> deleteStockItem(@PathVariable UUID id) {
        stockItemService.deleteItem(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Retrieves a paginated list of stock items whose current quantity is below
     * their configured minimum threshold.
     *
     * @param pageable pagination parameters
     * @return 200 OK with a page of low-stock {@link StockItemResponseDTO}
     */
    @PreAuthorize("hasAuthority('ACCESS_INVENTORY_ADMIN') or hasAuthority('ROLE_ADMIN')")
    @GetMapping("/administrative/items/low-stock")
    public ResponseEntity<Page<StockItemResponseDTO>> getLowStockItems(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(stockItemService.findLowStockItems(pageable));
    }

    /**
     * Retrieves a paginated audit trail of all inventory movements across all stock items.
     *
     * @param pageable pagination and sort parameters (default: page 0, size 20, sorted by createdAt DESC)
     * @return 200 OK with a page of {@link InventoryMovement}
     */
    @PreAuthorize("hasAuthority('ACCESS_INVENTORY_IT') or hasAuthority('ROLE_ADMIN')")
    @GetMapping("/administrative/movements")
    public ResponseEntity<Page<InventoryMovement>> getStockMovements(@PageableDefault(size = 20, sort = "createdAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(stockItemService.findAllMovements(pageable));
    }

    /**
     * Retrieves a paginated audit trail of movements for a specific stock item.
     *
     * @param id       target item identifier
     * @param pageable pagination and sort parameters (default: page 0, size 20, sorted by createdAt DESC)
     * @return 200 OK with a page of {@link InventoryMovement} for the item
     */
    @PreAuthorize("hasAuthority('ACCESS_INVENTORY_ADMIN') or hasAuthority('ROLE_ADMIN')")
    @GetMapping("/administrative/items/{id}/movements")
    public ResponseEntity<Page<InventoryMovement>> getMovementsByItem(
            @PathVariable UUID id,
            @PageableDefault(size = 20, sort = "createdAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(stockItemService.findMovementsByItem(id, pageable));
    }
}
