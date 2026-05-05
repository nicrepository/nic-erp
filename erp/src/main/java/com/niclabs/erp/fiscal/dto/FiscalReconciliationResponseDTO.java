package com.niclabs.erp.fiscal.dto;

import com.niclabs.erp.fiscal.domain.FiscalInvoice;
import com.niclabs.erp.fiscal.domain.FiscalInvoiceItem;
import com.niclabs.erp.purchasing.domain.PurchaseOrder;
import com.niclabs.erp.purchasing.domain.PurchaseOrderItem;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

public record FiscalReconciliationResponseDTO(
        ReconciliationStatus status,
        int divergenceCount,
        BigDecimal orderTotalValue,
        BigDecimal invoiceTotalValue,
        BigDecimal totalDifference,
        List<String> messages,
        List<FiscalReconciliationItemDTO> items
) {
    public static FiscalReconciliationResponseDTO notLinked(FiscalInvoice invoice) {
        return new FiscalReconciliationResponseDTO(
                ReconciliationStatus.NOT_LINKED,
                0,
                BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
                money(invoice.getTotalValue()),
                BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
                List.of("Nota fiscal sem pedido de compra vinculado."),
                List.of()
        );
    }

    public static FiscalReconciliationResponseDTO fromEntity(FiscalInvoice invoice) {
        PurchaseOrder order = invoice.getPurchaseOrder();
        if (order == null) {
            return notLinked(invoice);
        }

        List<String> messages = new ArrayList<>();
        List<FiscalReconciliationItemDTO> items = new ArrayList<>();
        int divergences = 0;

        if (!order.getSupplier().getId().equals(invoice.getSupplier().getId())) {
            messages.add("Fornecedor da nota fiscal diverge do fornecedor do pedido de compra.");
            divergences++;
        }

        BigDecimal orderTotal = money(order.getTotalEstimatedValue());
        BigDecimal invoiceTotal = money(invoice.getTotalValue());
        BigDecimal totalDifference = invoiceTotal.subtract(orderTotal).setScale(2, RoundingMode.HALF_UP);
        if (totalDifference.compareTo(BigDecimal.ZERO) != 0) {
            messages.add("Valor total da nota fiscal diverge do valor do pedido de compra.");
            divergences++;
        }

        Map<String, PurchaseOrderItem> orderItems = new LinkedHashMap<>();
        for (PurchaseOrderItem item : order.getItems()) {
            orderItems.put(itemKey(item.getStockItemId(), item.getDescription()), item);
        }

        Map<String, FiscalInvoiceItem> invoiceItems = new LinkedHashMap<>();
        for (FiscalInvoiceItem item : invoice.getItems()) {
            invoiceItems.put(itemKey(item.getStockItemId(), item.getDescription()), item);
        }

        for (Map.Entry<String, PurchaseOrderItem> entry : orderItems.entrySet()) {
            PurchaseOrderItem orderItem = entry.getValue();
            FiscalInvoiceItem invoiceItem = invoiceItems.remove(entry.getKey());
            FiscalReconciliationItemDTO itemDTO = compareItem(orderItem, invoiceItem);
            items.add(itemDTO);
            if (itemDTO.status() != ReconciliationStatus.MATCHED) {
                divergences++;
            }
        }

        for (FiscalInvoiceItem invoiceItem : invoiceItems.values()) {
            items.add(FiscalReconciliationItemDTO.invoiceOnly(invoiceItem));
            divergences++;
        }

        if (messages.isEmpty() && divergences == 0) {
            messages.add("Pedido, recebimento e nota fiscal conciliados.");
        }

        return new FiscalReconciliationResponseDTO(
                divergences == 0 ? ReconciliationStatus.MATCHED : ReconciliationStatus.DIVERGENT,
                divergences,
                orderTotal,
                invoiceTotal,
                totalDifference,
                messages,
                items
        );
    }

    public boolean hasBlockingDivergence() {
        return status == ReconciliationStatus.DIVERGENT;
    }

    private static FiscalReconciliationItemDTO compareItem(PurchaseOrderItem orderItem, FiscalInvoiceItem invoiceItem) {
        if (invoiceItem == null) {
            return FiscalReconciliationItemDTO.orderOnly(orderItem);
        }

        List<String> messages = new ArrayList<>();
        BigDecimal orderedQuantity = quantity(orderItem.getQuantity());
        BigDecimal receivedQuantity = quantity(orderItem.getReceivedQuantity());
        BigDecimal invoiceQuantity = quantity(invoiceItem.getQuantity());
        BigDecimal orderedUnitValue = money(orderItem.getUnitValue());
        BigDecimal invoiceUnitValue = money(invoiceItem.getUnitValue());

        if (invoiceQuantity.compareTo(orderedQuantity) != 0) {
            messages.add("Quantidade da nota diverge do pedido.");
        }
        if (invoiceQuantity.compareTo(receivedQuantity) > 0) {
            messages.add("Quantidade da nota excede o total recebido.");
        }
        if (invoiceUnitValue.compareTo(orderedUnitValue) != 0) {
            messages.add("Valor unitário da nota diverge do pedido.");
        }

        return new FiscalReconciliationItemDTO(
                orderItem.getId(),
                invoiceItem.getId(),
                orderItem.getStockItemId() != null ? orderItem.getStockItemId() : invoiceItem.getStockItemId(),
                invoiceItem.getDescription(),
                orderedQuantity,
                receivedQuantity,
                invoiceQuantity,
                orderedUnitValue,
                invoiceUnitValue,
                invoiceQuantity.subtract(receivedQuantity).setScale(3, RoundingMode.HALF_UP),
                messages.isEmpty() ? ReconciliationStatus.MATCHED : ReconciliationStatus.DIVERGENT,
                messages
        );
    }

    private static String itemKey(UUID stockItemId, String description) {
        if (stockItemId != null) return "stock:" + stockItemId;
        return "desc:" + (description == null ? "" : description.trim().toLowerCase(Locale.ROOT));
    }

    private static BigDecimal money(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(2, RoundingMode.HALF_UP);
    }

    private static BigDecimal quantity(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(3, RoundingMode.HALF_UP);
    }

    public enum ReconciliationStatus {
        NOT_LINKED,
        MATCHED,
        DIVERGENT,
        MISSING_IN_INVOICE,
        NOT_IN_ORDER
    }

    public record FiscalReconciliationItemDTO(
            UUID orderItemId,
            UUID invoiceItemId,
            UUID stockItemId,
            String description,
            BigDecimal orderedQuantity,
            BigDecimal receivedQuantity,
            BigDecimal invoiceQuantity,
            BigDecimal orderedUnitValue,
            BigDecimal invoiceUnitValue,
            BigDecimal quantityOverReceived,
            ReconciliationStatus status,
            List<String> messages
    ) {
        static FiscalReconciliationItemDTO orderOnly(PurchaseOrderItem item) {
            return new FiscalReconciliationItemDTO(
                    item.getId(),
                    null,
                    item.getStockItemId(),
                    item.getDescription(),
                    quantity(item.getQuantity()),
                    quantity(item.getReceivedQuantity()),
                    BigDecimal.ZERO.setScale(3, RoundingMode.HALF_UP),
                    money(item.getUnitValue()),
                    BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
                    BigDecimal.ZERO.setScale(3, RoundingMode.HALF_UP).subtract(quantity(item.getReceivedQuantity())),
                    ReconciliationStatus.MISSING_IN_INVOICE,
                    List.of("Item do pedido não encontrado na nota fiscal.")
            );
        }

        static FiscalReconciliationItemDTO invoiceOnly(FiscalInvoiceItem item) {
            return new FiscalReconciliationItemDTO(
                    null,
                    item.getId(),
                    item.getStockItemId(),
                    item.getDescription(),
                    BigDecimal.ZERO.setScale(3, RoundingMode.HALF_UP),
                    BigDecimal.ZERO.setScale(3, RoundingMode.HALF_UP),
                    quantity(item.getQuantity()),
                    BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
                    money(item.getUnitValue()),
                    quantity(item.getQuantity()),
                    ReconciliationStatus.NOT_IN_ORDER,
                    List.of("Item da nota fiscal não encontrado no pedido de compra.")
            );
        }
    }
}
