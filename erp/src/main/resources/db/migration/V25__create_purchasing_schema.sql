CREATE SCHEMA IF NOT EXISTS purchasing;

CREATE TABLE purchasing.purchase_requests (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    justification TEXT,
    cost_center VARCHAR(100),
    status VARCHAR(30) NOT NULL,
    requested_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE purchasing.purchase_request_items (
    id UUID PRIMARY KEY,
    request_id UUID NOT NULL REFERENCES purchasing.purchase_requests(id) ON DELETE CASCADE,
    stock_item_id UUID REFERENCES inventory.stock_items(id),
    description VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    quantity NUMERIC(14, 3) NOT NULL,
    estimated_unit_value NUMERIC(14, 2) NOT NULL DEFAULT 0,
    estimated_total_value NUMERIC(14, 2) NOT NULL DEFAULT 0
);

CREATE TABLE purchasing.purchase_orders (
    id UUID PRIMARY KEY,
    request_id UUID REFERENCES purchasing.purchase_requests(id),
    supplier_id UUID NOT NULL REFERENCES fiscal.suppliers(id),
    number VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(30) NOT NULL,
    issue_date DATE NOT NULL,
    expected_delivery_date DATE,
    total_estimated_value NUMERIC(14, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE purchasing.purchase_order_items (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES purchasing.purchase_orders(id) ON DELETE CASCADE,
    stock_item_id UUID REFERENCES inventory.stock_items(id),
    description VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    quantity NUMERIC(14, 3) NOT NULL,
    unit_value NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_value NUMERIC(14, 2) NOT NULL DEFAULT 0
);

ALTER TABLE fiscal.invoices
    ADD COLUMN purchase_order_id UUID REFERENCES purchasing.purchase_orders(id);

INSERT INTO auth.permissions (id, name)
SELECT gen_random_uuid(), 'ACCESS_PURCHASES'
WHERE NOT EXISTS (SELECT 1 FROM auth.permissions WHERE name = 'ACCESS_PURCHASES');
