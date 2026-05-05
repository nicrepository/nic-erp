package com.niclabs.erp.fiscal.domain;

import com.niclabs.erp.purchasing.domain.PurchaseOrder;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "invoices", schema = "fiscal")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FiscalInvoice {

    @Id
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

    @ManyToOne
    @JoinColumn(name = "purchase_order_id")
    private PurchaseOrder purchaseOrder;

    @Column(nullable = false)
    private String number;

    private String series;

    @Column(name = "access_key")
    private String accessKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "invoice_type", nullable = false)
    private FiscalInvoiceType invoiceType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FiscalInvoiceStatus status = FiscalInvoiceStatus.RECEIVED;

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Column(name = "received_date")
    private LocalDate receivedDate;

    @Column(name = "product_value", nullable = false, precision = 14, scale = 2)
    private BigDecimal productValue = BigDecimal.ZERO;

    @Column(name = "freight_value", nullable = false, precision = 14, scale = 2)
    private BigDecimal freightValue = BigDecimal.ZERO;

    @Column(name = "discount_value", nullable = false, precision = 14, scale = 2)
    private BigDecimal discountValue = BigDecimal.ZERO;

    @Column(name = "tax_value", nullable = false, precision = 14, scale = 2)
    private BigDecimal taxValue = BigDecimal.ZERO;

    @Column(name = "total_value", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalValue = BigDecimal.ZERO;

    @Column(name = "cost_center")
    private String costCenter;

    @Column(name = "purchase_order_reference")
    private String purchaseOrderReference;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "divergence_notes", columnDefinition = "TEXT")
    private String divergenceNotes;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "launched_by")
    private UUID launchedBy;

    @Column(name = "launched_at")
    private LocalDateTime launchedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FiscalInvoiceItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FiscalInvoiceAttachment> attachments = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
