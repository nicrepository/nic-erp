package com.niclabs.erp.inventory.controller;

import com.niclabs.erp.inventory.domain.ITAsset;
import com.niclabs.erp.inventory.domain.ITAssetHistory;
import com.niclabs.erp.inventory.domain.InventoryMovement;
import com.niclabs.erp.inventory.domain.StockItem;
import com.niclabs.erp.inventory.dto.ITAssetDTO;
import com.niclabs.erp.inventory.dto.StockItemDTO;
import com.niclabs.erp.inventory.service.ITAssetService;
import com.niclabs.erp.inventory.service.StockItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import java.util.List;

import java.util.UUID;

@RestController
@RequestMapping("/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final StockItemService stockItemService;
    private final ITAssetService itAssetService;

    // ==========================================
    // ESTOQUE ADMINISTRATIVO
    // ==========================================

    @PreAuthorize("hasAuthority('ACCESS_INVENTORY_ADMIN') or hasAuthority('ROLE_ADMIN')")
    @PostMapping("/administrative/items")
    public ResponseEntity<StockItem> createStockItem(@RequestBody StockItemDTO dto) {
        StockItem created = stockItemService.createItem(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PreAuthorize("hasAuthority('ACCESS_INVENTORY_ADMIN') or hasAuthority('ROLE_ADMIN')")
    @PostMapping("/administrative/items/{id}/add")
    public ResponseEntity<String> addStock(@PathVariable UUID id, @RequestParam Integer quantity) {
        stockItemService.addStock(id, quantity);
        return ResponseEntity.ok("Entrada de estoque registrada com sucesso!");
    }

    @PreAuthorize("hasAuthority('ACCESS_INVENTORY_ADMIN') or hasAuthority('ROLE_ADMIN')")
    @PostMapping("/administrative/items/{id}/remove")
    public ResponseEntity<String> removeStock(@PathVariable UUID id, @RequestParam Integer quantity) {
        try {
            stockItemService.removeStock(id, quantity);
            return ResponseEntity.ok("Saída de estoque registrada com sucesso!");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PreAuthorize("hasAuthority('ACCESS_INVENTORY_ADMIN') or hasAuthority('ROLE_ADMIN')")
    @GetMapping("/administrative/items")
    public ResponseEntity<List<StockItem>> getAllStockItems() {
        return ResponseEntity.ok(stockItemService.findAllItems());
    }

    @PreAuthorize("hasAuthority('ACCESS_INVENTORY_ADMIN') or hasAuthority('ROLE_ADMIN')")
    @PutMapping("/administrative/items/{id}")
    public ResponseEntity<StockItem> updateStockItem(
            @PathVariable UUID id,
            @RequestBody StockItemDTO dto) {

        StockItem updatedItem = stockItemService.updateItem(id, dto);
        return ResponseEntity.ok(updatedItem);
    }

    // ==========================================
    // ESTOQUE DE TI
    // ==========================================

    @PreAuthorize("hasAuthority('ACCESS_INVENTORY_IT') or hasAuthority('ROLE_ADMIN')")
    @PostMapping("/it/assets")
    public ResponseEntity<ITAsset> registerITAsset(@RequestBody ITAssetDTO dto) {
        ITAsset created = itAssetService.registerAsset(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PreAuthorize("hasAuthority('ACCESS_INVENTORY_IT') or hasAuthority('ROLE_ADMIN')")
    @GetMapping("/it/assets")
    public ResponseEntity<List<ITAsset>> getAllITAssets() {
        return ResponseEntity.ok(itAssetService.findAllAssets());
    }

    // Veja a anotação @PreAuthorize blindando a rota!
    @PreAuthorize("hasAuthority('ACCESS_INVENTORY_IT') or hasAuthority('ROLE_ADMIN')")
    @PutMapping("/it/assets/{id}/assign")
    public ResponseEntity<ITAsset> assignAsset(
            @PathVariable UUID id,
            @RequestParam UUID userId) {

        ITAsset updatedAsset = itAssetService.assignAssetToUser(id, userId);
        return ResponseEntity.ok(updatedAsset);
    }

    // DESVINCULAR EQUIPAMENTO
    @PreAuthorize("hasAuthority('ACCESS_INVENTORY_IT') or hasAuthority('ROLE_ADMIN')")
    @PutMapping("/it/assets/{id}/unassign")
    public ResponseEntity<ITAsset> unassignAsset(@PathVariable UUID id) {
        ITAsset updatedAsset = itAssetService.unassignAsset(id);
        return ResponseEntity.ok(updatedAsset);
    }

    // EDITAR EQUIPAMENTO
    @PreAuthorize("hasAuthority('ACCESS_INVENTORY_IT') or hasAuthority('ROLE_ADMIN')")
    @PutMapping("/it/assets/{id}")
    public ResponseEntity<ITAsset> updateITAsset(
            @PathVariable UUID id,
            @RequestBody ITAssetDTO dto) {
        ITAsset updatedAsset = itAssetService.updateAsset(id, dto);
        return ResponseEntity.ok(updatedAsset);
    }

    @PreAuthorize("hasAuthority('ACCESS_INVENTORY_IT') or hasAuthority('ROLE_ADMIN')")
    @GetMapping("/it/assets/{id}/history")
    public ResponseEntity<List<ITAssetHistory>> getAssetHistory(@PathVariable UUID id) {
        return ResponseEntity.ok(itAssetService.getAssetHistory(id));
    }

    // Você pode criar um DTO simples para receber o motivo, ou pegar direto como String/Map
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
    @PreAuthorize("hasAuthority('ACCESS_INVENTORY_IT') or hasAuthority('ROLE_ADMIN')")
    @GetMapping("/administrative/movements")
    public ResponseEntity<List<InventoryMovement>> getStockMovements() {
        return ResponseEntity.ok(stockItemService.findAllMovements());
    }
}
