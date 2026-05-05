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
@Table(name = "purchase_request_items", schema = "purchasing")
@Getter
@Setter
@NoArgsConstructor
public class PurchaseRequestItem {

    @Id
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "request_id", nullable = false)
    private PurchaseRequest request;

    @Column(name = "stock_item_id")
    private UUID stockItemId;

    @Column(nullable = false)
    private String description;

    private String category;

    @Column(nullable = false, precision = 14, scale = 3)
    private BigDecimal quantity;

    @Column(name = "estimated_unit_value", nullable = false, precision = 14, scale = 2)
    private BigDecimal estimatedUnitValue = BigDecimal.ZERO;

    @Column(name = "estimated_total_value", nullable = false, precision = 14, scale = 2)
    private BigDecimal estimatedTotalValue = BigDecimal.ZERO;
}
