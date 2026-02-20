package com.niclabs.erp.inventory.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "stock_items", schema = "inventory")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StockItem {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "minimum_stock", nullable = false)
    private Integer minimumStock;
}
