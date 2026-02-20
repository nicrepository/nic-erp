-- Criação do schema lógico para isolar o módulo de autenticação
CREATE SCHEMA IF NOT EXISTS auth;

-- Criação da tabela de usuários baseada na entidade User
CREATE TABLE auth.users (
                            id UUID PRIMARY KEY,
                            name VARCHAR(255) NOT NULL,
                            email VARCHAR(255) UNIQUE NOT NULL,
                            password VARCHAR(255) NOT NULL,
                            active BOOLEAN DEFAULT TRUE
);