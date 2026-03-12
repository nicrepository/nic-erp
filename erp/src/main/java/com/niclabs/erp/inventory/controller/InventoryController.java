package com.niclabs.erp.inventory.controller;

import com.niclabs.erp.inventory.domain.ITAsset;
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

    @PreAuthorize("hasRole('ADMIN') or hasRole('RH')")
    @PostMapping("/administrative/items")
    public ResponseEntity<StockItem> createStockItem(@RequestBody StockItemDTO dto) {
        StockItem created = stockItemService.createItem(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('RH')")
    @PostMapping("/administrative/items/{id}/add")
    public ResponseEntity<String> addStock(@PathVariable UUID id, @RequestParam Integer quantity) {
        stockItemService.addStock(id, quantity);
        return ResponseEntity.ok("Entrada de estoque registrada com sucesso!");
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('RH')")
    @PostMapping("/administrative/items/{id}/remove")
    public ResponseEntity<String> removeStock(@PathVariable UUID id, @RequestParam Integer quantity) {
        try {
            stockItemService.removeStock(id, quantity);
            return ResponseEntity.ok("Saída de estoque registrada com sucesso!");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('RH')")
    @GetMapping("/administrative/items")
    public ResponseEntity<List<StockItem>> getAllStockItems() {
        return ResponseEntity.ok(stockItemService.findAllItems());
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('RH')")
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

    @PreAuthorize("hasRole('ADMIN') or hasRole('TI')")
    @PostMapping("/it/assets")
    public ResponseEntity<ITAsset> registerITAsset(@RequestBody ITAssetDTO dto) {
        ITAsset created = itAssetService.registerAsset(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('TI')")
    @GetMapping("/it/assets")
    public ResponseEntity<List<ITAsset>> getAllITAssets() {
        return ResponseEntity.ok(itAssetService.findAllAssets());
    }

    // Veja a anotação @PreAuthorize blindando a rota!
    @PreAuthorize("hasRole('ADMIN') or hasRole('TI')")
    @PutMapping("/it/assets/{id}/assign")
    public ResponseEntity<ITAsset> assignAsset(
            @PathVariable UUID id,
            @RequestParam UUID userId) {

        ITAsset updatedAsset = itAssetService.assignAssetToUser(id, userId);
        return ResponseEntity.ok(updatedAsset);
    }

    // DESVINCULAR EQUIPAMENTO
    @PreAuthorize("hasRole('TI') or hasRole('ADMIN')")
    @PutMapping("/it/assets/{id}/unassign")
    public ResponseEntity<ITAsset> unassignAsset(@PathVariable UUID id) {
        ITAsset updatedAsset = itAssetService.unassignAsset(id);
        return ResponseEntity.ok(updatedAsset);
    }

    // EDITAR EQUIPAMENTO
    @PreAuthorize("hasRole('TI') or hasRole('ADMIN')")
    @PutMapping("/it/assets/{id}")
    public ResponseEntity<ITAsset> updateITAsset(
            @PathVariable UUID id,
            @RequestBody ITAssetDTO dto) {
        ITAsset updatedAsset = itAssetService.updateAsset(id, dto);
        return ResponseEntity.ok(updatedAsset);
    }
}
