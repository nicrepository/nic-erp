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

    @PostMapping("/administrative/items")
    public ResponseEntity<StockItem> createStockItem(@RequestBody StockItemDTO dto) {
        StockItem created = stockItemService.createItem(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/administrative/items/{id}/add")
    public ResponseEntity<String> addStock(@PathVariable UUID id, @RequestParam Integer quantity) {
        stockItemService.addStock(id, quantity);
        return ResponseEntity.ok("Entrada de estoque registrada com sucesso!");
    }

    @PostMapping("/administrative/items/{id}/remove")
    public ResponseEntity<String> removeStock(@PathVariable UUID id, @RequestParam Integer quantity) {
        try {
            stockItemService.removeStock(id, quantity);
            return ResponseEntity.ok("Saída de estoque registrada com sucesso!");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/administrative/items")
    public ResponseEntity<List<StockItem>> getAllStockItems() {
        return ResponseEntity.ok(stockItemService.findAllItems());
    }

    // ==========================================
    // ESTOQUE DE TI
    // ==========================================

    @PostMapping("/it/assets")
    public ResponseEntity<ITAsset> registerITAsset(@RequestBody ITAssetDTO dto) {
        ITAsset created = itAssetService.registerAsset(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/it/assets")
    public ResponseEntity<List<ITAsset>> getAllITAssets() {
        return ResponseEntity.ok(itAssetService.findAllAssets());
    }

    // Veja a anotação @PreAuthorize blindando a rota!
    @PreAuthorize("hasRole('TI') or hasRole('ADMIN')")
    @PutMapping("/it/assets/{id}/assign")
    public ResponseEntity<ITAsset> assignAsset(
            @PathVariable UUID id,
            @RequestParam UUID userId) {

        ITAsset updatedAsset = itAssetService.assignAssetToUser(id, userId);
        return ResponseEntity.ok(updatedAsset);
    }
}
