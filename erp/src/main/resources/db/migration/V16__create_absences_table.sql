CREATE TABLE hr.absences (
                             id UUID PRIMARY KEY,
                             employee_id UUID NOT NULL,
                             absence_type VARCHAR(50) NOT NULL, -- Ex: FERIAS, DAY_OFF, ATESTADO, LICENCA
                             start_date DATE NOT NULL,
                             end_date DATE NOT NULL,
                             description VARCHAR(255),          -- Um detalhe opcional (Ex: "Aniversário do Caio", "Consulta Médica")
                             status VARCHAR(20) DEFAULT 'AGENDADO', -- AGENDADO, EM_ANDAMENTO, CONCLUIDO, CANCELADO

                             created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                             updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Chave estrangeira ligando a ausência ao funcionário.
    -- ON DELETE CASCADE significa que se o funcionário for deletado do sistema, o histórico de ausências dele também será.
                             CONSTRAINT fk_absence_employee FOREIGN KEY (employee_id) REFERENCES hr.employees(id) ON DELETE CASCADE
);