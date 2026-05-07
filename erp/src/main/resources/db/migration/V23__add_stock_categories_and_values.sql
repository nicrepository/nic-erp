CREATE TABLE inventory.stock_categories (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO inventory.stock_categories (id, name)
SELECT gen_random_uuid(), category
FROM (
    SELECT DISTINCT trim(category) AS category
    FROM inventory.stock_items
    WHERE category IS NOT NULL AND trim(category) <> ''
) existing_categories
ON CONFLICT (name) DO NOTHING;

ALTER TABLE inventory.stock_items
    ADD COLUMN unit_value NUMERIC(12, 2) NOT NULL DEFAULT 0;

ALTER TABLE inventory.inventory_movements
    ADD COLUMN unit_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN total_value NUMERIC(12, 2) NOT NULL DEFAULT 0;
