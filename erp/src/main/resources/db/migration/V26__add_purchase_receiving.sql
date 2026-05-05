ALTER TABLE purchasing.purchase_order_items
    ADD COLUMN received_quantity NUMERIC(14, 3) NOT NULL DEFAULT 0;
