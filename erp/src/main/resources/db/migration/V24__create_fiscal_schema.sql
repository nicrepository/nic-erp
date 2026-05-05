CREATE SCHEMA IF NOT EXISTS fiscal;

CREATE TABLE fiscal.suppliers (
    id UUID PRIMARY KEY,
    legal_name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    document VARCHAR(20) NOT NULL UNIQUE,
    state_registration VARCHAR(50),
    municipal_registration VARCHAR(50),
    fiscal_email VARCHAR(255),
    phone VARCHAR(30),
    contact_name VARCHAR(255),
    category VARCHAR(100),
    street VARCHAR(255),
    number VARCHAR(30),
    complement VARCHAR(100),
    district VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(20),
    notes TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE fiscal.invoices (
    id UUID PRIMARY KEY,
    supplier_id UUID NOT NULL REFERENCES fiscal.suppliers(id),
    number VARCHAR(50) NOT NULL,
    series VARCHAR(20),
    access_key VARCHAR(60),
    invoice_type VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL,
    issue_date DATE NOT NULL,
    received_date DATE,
    product_value NUMERIC(14, 2) NOT NULL DEFAULT 0,
    freight_value NUMERIC(14, 2) NOT NULL DEFAULT 0,
    discount_value NUMERIC(14, 2) NOT NULL DEFAULT 0,
    tax_value NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_value NUMERIC(14, 2) NOT NULL DEFAULT 0,
    cost_center VARCHAR(100),
    purchase_order_reference VARCHAR(100),
    notes TEXT,
    divergence_notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    launched_by UUID REFERENCES auth.users(id),
    launched_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT uk_fiscal_invoice_supplier_number_series UNIQUE (supplier_id, number, series)
);

CREATE TABLE fiscal.invoice_items (
    id UUID PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES fiscal.invoices(id) ON DELETE CASCADE,
    stock_item_id UUID REFERENCES inventory.stock_items(id),
    description VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    quantity NUMERIC(14, 3) NOT NULL,
    unit_value NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_value NUMERIC(14, 2) NOT NULL DEFAULT 0,
    ncm VARCHAR(20),
    cfop VARCHAR(20),
    enters_stock BOOLEAN NOT NULL DEFAULT FALSE,
    patrimony BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE fiscal.invoice_attachments (
    id UUID PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES fiscal.invoices(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(100),
    attachment_type VARCHAR(20) NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO auth.permissions (id, name)
SELECT gen_random_uuid(), 'ACCESS_FISCAL'
WHERE NOT EXISTS (SELECT 1 FROM auth.permissions WHERE name = 'ACCESS_FISCAL');

ALTER TABLE inventory.inventory_movements
    ADD COLUMN origin_type VARCHAR(50),
    ADD COLUMN origin_id UUID,
    ADD COLUMN origin_description VARCHAR(255);
