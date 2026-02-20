-- Criação do schema lógico para isolar o módulo de estoque
CREATE SCHEMA IF NOT EXISTS inventory;

-- Tabela para Estoque de TI (Ativos únicos)
CREATE TABLE inventory.it_assets (
                                     id UUID PRIMARY KEY,
                                     serial_number VARCHAR(100) NOT NULL,
                                     asset_tag VARCHAR(50) UNIQUE NOT NULL,
                                     model VARCHAR(100) NOT NULL,
                                     brand VARCHAR(100) NOT NULL,
                                     status VARCHAR(50) NOT NULL,
                                     assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Tabela para Estoque Administrativo (Itens por quantidade)
CREATE TABLE inventory.stock_items (
                                       id UUID PRIMARY KEY,
                                       name VARCHAR(255) NOT NULL,
                                       category VARCHAR(100) NOT NULL,
                                       quantity INT NOT NULL DEFAULT 0,
                                       minimum_stock INT NOT NULL DEFAULT 0
);