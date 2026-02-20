-- Tabela de histórico de movimentações do estoque
CREATE TABLE inventory.inventory_movements (
                                               id UUID PRIMARY KEY,
                                               item_id UUID NOT NULL,
                                               type VARCHAR(50) NOT NULL,
                                               quantity INT NOT NULL,
                                               performed_by UUID NOT NULL REFERENCES auth.users(id),
                                               created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);