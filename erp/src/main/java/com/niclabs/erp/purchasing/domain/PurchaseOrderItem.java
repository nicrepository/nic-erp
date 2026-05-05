package com.niclabs.erp.purchasing.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "purchase_order_items", schema = "purchasing")
@Getter
@Setter
@NoArgsConstructor
public class PurchaseOrderItem {

    @Id
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private PurchaseOrder order;

    @Column(name = "stock_item_id")
    private UUID stockItemId;

    @Column(nullable = false)
    private String description;

    private String category;

    @Column(nullable = false, precision = 14, scale = 3)
    private BigDecimal quantity;

    @Column(name = "unit_value", nullable = false, precision = 14, scale = 2)
    private BigDecimal unitValue = BigDecimal.ZERO;

    @Column(name = "total_value", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalValue = BigDecimal.ZERO;

    @Column(name = "received_quantity", nullable = false, precision = 14, scale = 3)
    private BigDecimal receivedQuantity = BigDecimal.ZERO;
}
