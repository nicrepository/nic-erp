package com.niclabs.erp.inventory.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record StockItemResponseDTO(
        UUID id,
        String name,
        String category,
        Integer quantity,
        Integer minimumStock,
        BigDecimal unitValue,
        BigDecimal totalValue,
        String unitOfMeasure,
        String notes
) {}
