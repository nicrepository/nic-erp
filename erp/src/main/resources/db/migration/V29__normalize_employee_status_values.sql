UPDATE hr.employees
SET status = 'AFASTADO'
WHERE status = 'DAY_OFF';

ALTER TABLE hr.employees
    DROP CONSTRAINT IF EXISTS employees_status_check;

ALTER TABLE hr.employees
    ADD CONSTRAINT employees_status_check
        CHECK (status IN ('ATIVO', 'DESLIGADO', 'FERIAS', 'AFASTADO'));
