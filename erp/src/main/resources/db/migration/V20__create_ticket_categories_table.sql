-- Tabela de categorias de chamados gerenciadas pelo administrador
CREATE TABLE helpdesk.ticket_categories (
    id          UUID PRIMARY KEY,
    name        VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    priority    VARCHAR(50)  NOT NULL,
    department  VARCHAR(50)  NOT NULL,
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- Coluna opcional que vincula um chamado à categoria escolhida na abertura
ALTER TABLE helpdesk.tickets
    ADD COLUMN category_id UUID REFERENCES helpdesk.ticket_categories(id);
