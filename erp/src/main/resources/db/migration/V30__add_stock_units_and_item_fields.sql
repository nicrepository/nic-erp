-- Creates the unit-of-measure reference table and adds new columns to stock_items

CREATE TABLE inventory.stock_units (
    id         UUID         PRIMARY KEY,
    name       VARCHAR(100) NOT NULL UNIQUE,
    active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP             DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO inventory.stock_units (id, name) VALUES
    (gen_random_uuid(), 'Unidade'),
    (gen_random_uuid(), 'Caixa'),
    (gen_random_uuid(), 'Pacote'),
    (gen_random_uuid(), 'Resma'),
    (gen_random_uuid(), 'Litro'),
    (gen_random_uuid(), 'Kg');

ALTER TABLE inventory.stock_items
    ADD COLUMN unit_of_measure VARCHAR(100),
    ADD COLUMN notes           TEXT;
