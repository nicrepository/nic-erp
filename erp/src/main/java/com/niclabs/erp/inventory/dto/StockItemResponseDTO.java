package com.niclabs.erp.inventory.dto;

import java.util.UUID;

public record StockItemResponseDTO(
        UUID id,
        String name,
        String category,
        Integer quantity,
        Integer minimumStock
) {}
