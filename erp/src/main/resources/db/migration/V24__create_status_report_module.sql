-- Cadastro de Empresas (Parceiros e Clientes)
CREATE TABLE status_report_companies (
                                         id UUID PRIMARY KEY,
                                         name VARCHAR(150) NOT NULL,
                                         type VARCHAR(40) NOT NULL,
                                         active BOOLEAN NOT NULL DEFAULT TRUE,
                                         notes TEXT,
                                         created_by VARCHAR(150),
                                         created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                         updated_by VARCHAR(150),
                                         updated_at TIMESTAMP WITHOUT TIME ZONE
);

-- Tabela Principal de Status Reports
CREATE TABLE status_reports (
                                id UUID PRIMARY KEY,
                                strategic_level VARCHAR(30) NOT NULL DEFAULT 'PENDING',
                                sap_partner_id UUID NOT NULL,
                                final_customer_id UUID NOT NULL,
                                report_date DATE NOT NULL,
                                involved_people TEXT NOT NULL,
                                activity TEXT NOT NULL,
                                daily_status TEXT NOT NULL,
                                difficulty_level VARCHAR(30) NOT NULL DEFAULT 'NOT_INFORMED',
                                situation VARCHAR(50) NOT NULL DEFAULT 'NOT_INFORMED',
                                active BOOLEAN NOT NULL DEFAULT TRUE,
                                created_by VARCHAR(150),
                                created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                updated_by VARCHAR(150),
                                updated_at TIMESTAMP WITHOUT TIME ZONE,

                                CONSTRAINT fk_status_report_sap_partner
                                    FOREIGN KEY (sap_partner_id)
                                        REFERENCES status_report_companies (id),

                                CONSTRAINT fk_status_report_final_customer
                                    FOREIGN KEY (final_customer_id)
                                        REFERENCES status_report_companies (id)
);

-- Índices para empresas
CREATE INDEX idx_status_report_companies_type
    ON status_report_companies(type);

CREATE INDEX idx_status_report_companies_active
    ON status_report_companies(active);

CREATE INDEX idx_status_report_companies_name
    ON status_report_companies(name);

-- Índices para status report
CREATE INDEX idx_status_report_date
    ON status_reports(report_date);

CREATE INDEX idx_status_report_partner
    ON status_reports(sap_partner_id);

CREATE INDEX idx_status_report_customer
    ON status_reports(final_customer_id);

CREATE INDEX idx_status_report_strategic_level
    ON status_reports(strategic_level);

CREATE INDEX idx_status_report_difficulty_level
    ON status_reports(difficulty_level);

CREATE INDEX idx_status_report_situation
    ON status_reports(situation);

CREATE INDEX idx_status_report_active
    ON status_reports(active);