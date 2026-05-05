package com.niclabs.erp.fiscal.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "invoice_items", schema = "fiscal")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FiscalInvoiceItem {

    @Id
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "invoice_id", nullable = false)
    private FiscalInvoice invoice;

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

    private String ncm;
    private String cfop;

    @Column(name = "enters_stock", nullable = false)
    private boolean entersStock;

    @Column(nullable = false)
    private boolean patrimony;
}
