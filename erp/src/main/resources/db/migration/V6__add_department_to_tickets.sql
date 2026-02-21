-- Adiciona a coluna de departamento à tabela de chamados
ALTER TABLE helpdesk.tickets
    ADD COLUMN department VARCHAR(50) NOT NULL DEFAULT 'IT';