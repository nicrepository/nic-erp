-- 1. Cria o esquema do RH para separar da Autenticação e do Inventário
CREATE SCHEMA IF NOT EXISTS hr;

-- 2. Cria a tabela de Funcionários
CREATE TABLE hr.employees (
                              id UUID PRIMARY KEY,
                              user_id UUID UNIQUE, -- Relacionamento 1 para 1 com o login (Opcional, pois nem todo funcionário tem acesso ao sistema)

    -- Dados Pessoais
                              full_name VARCHAR(255) NOT NULL,
                              cpf VARCHAR(14) UNIQUE NOT NULL,
                              rg VARCHAR(20),
                              birth_date DATE,
                              phone VARCHAR(20),

    -- Dados Corporativos
                              registration_number VARCHAR(50) UNIQUE NOT NULL, -- Matrícula
                              admission_date DATE NOT NULL,
                              job_title VARCHAR(100) NOT NULL, -- Cargo real na empresa (ex: Analista Financeiro)
                              department VARCHAR(100) NOT NULL,
                              base_salary DECIMAL(10, 2),
                              status VARCHAR(20) DEFAULT 'ATIVO', -- ATIVO, FERIAS, AFASTADO, DESLIGADO

    -- Auditoria básica
                              created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                              updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Chave Estrangeira ligando com a tabela de usuários
                              CONSTRAINT fk_employee_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);