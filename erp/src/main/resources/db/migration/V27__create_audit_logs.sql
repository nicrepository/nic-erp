CREATE SCHEMA IF NOT EXISTS audit;

CREATE TABLE audit.audit_logs (
    id UUID PRIMARY KEY,
    occurred_at TIMESTAMP NOT NULL,
    actor_id UUID REFERENCES auth.users(id),
    actor_name VARCHAR(255),
    action VARCHAR(80) NOT NULL,
    module VARCHAR(80) NOT NULL,
    entity_type VARCHAR(120),
    entity_id UUID,
    summary VARCHAR(500),
    details TEXT
);

CREATE INDEX idx_audit_logs_occurred_at ON audit.audit_logs(occurred_at DESC);
CREATE INDEX idx_audit_logs_actor_id ON audit.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_module ON audit.audit_logs(module);
CREATE INDEX idx_audit_logs_action ON audit.audit_logs(action);
