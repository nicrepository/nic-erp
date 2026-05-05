package com.niclabs.erp.fiscal.dto;

import com.niclabs.erp.fiscal.domain.FiscalInvoice;
import com.niclabs.erp.fiscal.domain.FiscalInvoiceItem;
import com.niclabs.erp.fiscal.domain.FiscalInvoiceStatus;
import com.niclabs.erp.fiscal.domain.FiscalInvoiceType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record FiscalInvoiceResponseDTO(
        UUID id,
        SupplierResponseDTO supplier,
        UUID purchaseOrderId,
        String number,
        String series,
        String accessKey,
        FiscalInvoiceType invoiceType,
        FiscalInvoiceStatus status,
        LocalDate issueDate,
        LocalDate receivedDate,
        BigDecimal productValue,
        BigDecimal freightValue,
        BigDecimal discountValue,
        BigDecimal taxValue,
        BigDecimal totalValue,
        String costCenter,
        String purchaseOrderReference,
        String notes,
        String divergenceNotes,
        UUID createdBy,
        UUID launchedBy,
        LocalDateTime launchedAt,
        FiscalReconciliationResponseDTO reconciliation,
        List<FiscalInvoiceItemResponseDTO> items,
        List<FiscalInvoiceAttachmentResponseDTO> attachments
) {
    public static FiscalInvoiceResponseDTO fromEntity(FiscalInvoice invoice) {
        return new FiscalInvoiceResponseDTO(
                invoice.getId(),
                SupplierResponseDTO.fromEntity(invoice.getSupplier()),
                invoice.getPurchaseOrder() == null ? null : invoice.getPurchaseOrder().getId(),
                invoice.getNumber(),
                invoice.getSeries(),
                invoice.getAccessKey(),
                invoice.getInvoiceType(),
                invoice.getStatus(),
                invoice.getIssueDate(),
                invoice.getReceivedDate(),
                invoice.getProductValue(),
                invoice.getFreightValue(),
                invoice.getDiscountValue(),
                invoice.getTaxValue(),
                invoice.getTotalValue(),
                invoice.getCostCenter(),
                invoice.getPurchaseOrderReference(),
                invoice.getNotes(),
                invoice.getDivergenceNotes(),
                invoice.getCreatedBy(),
                invoice.getLaunchedBy(),
                invoice.getLaunchedAt(),
                FiscalReconciliationResponseDTO.fromEntity(invoice),
                invoice.getItems().stream().map(FiscalInvoiceItemResponseDTO::fromEntity).toList(),
                invoice.getAttachments().stream().map(FiscalInvoiceAttachmentResponseDTO::fromEntity).toList()
        );
    }

    public record FiscalInvoiceItemResponseDTO(
            UUID id,
            UUID stockItemId,
            String description,
            String category,
            BigDecimal quantity,
            BigDecimal unitValue,
            BigDecimal totalValue,
            String ncm,
            String cfop,
            boolean entersStock,
            boolean patrimony
    ) {
        public static FiscalInvoiceItemResponseDTO fromEntity(FiscalInvoiceItem item) {
            return new FiscalInvoiceItemResponseDTO(
                    item.getId(),
                    item.getStockItemId(),
                    item.getDescription(),
                    item.getCategory(),
                    item.getQuantity(),
                    item.getUnitValue(),
                    item.getTotalValue(),
                    item.getNcm(),
                    item.getCfop(),
                    item.isEntersStock(),
                    item.isPatrimony()
            );
        }
    }
}
