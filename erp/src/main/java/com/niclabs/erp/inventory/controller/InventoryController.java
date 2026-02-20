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

    // ==========================================
    // ESTOQUE DE TI
    // ==========================================

    @PostMapping("/it/assets")
    public ResponseEntity<ITAsset> registerITAsset(@RequestBody ITAssetDTO dto) {
        ITAsset created = itAssetService.registerAsset(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
