package com.niclabs.erp.purchasing.domain;

public enum PurchaseOrderStatus {
    OPEN,
    SENT_TO_SUPPLIER,
    PARTIALLY_RECEIVED,
    RECEIVED,
    LINKED_TO_INVOICE,
    CLOSED,
    CANCELLED
}
