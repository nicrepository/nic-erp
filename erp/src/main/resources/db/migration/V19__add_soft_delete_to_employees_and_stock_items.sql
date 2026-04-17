-- Soft delete para colaboradores
ALTER TABLE hr.employees
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Soft delete para itens de estoque
ALTER TABLE inventory.stock_items
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
