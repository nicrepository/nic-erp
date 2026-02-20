-- Tabela de Roles (Cargos/Perfis)
CREATE TABLE auth.roles (
                            id UUID PRIMARY KEY,
                            name VARCHAR(50) UNIQUE NOT NULL
);

-- Tabela de Permissões
CREATE TABLE auth.permissions (
                                  id UUID PRIMARY KEY,
                                  name VARCHAR(50) UNIQUE NOT NULL
);

-- Tabela intermediária: Usuários <-> Roles
CREATE TABLE auth.user_roles (
                                 user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
                                 role_id UUID NOT NULL REFERENCES auth.roles(id) ON DELETE CASCADE,
                                 PRIMARY KEY (user_id, role_id)
);

-- Tabela intermediária: Roles <-> Permissões
CREATE TABLE auth.role_permissions (
                                       role_id UUID NOT NULL REFERENCES auth.roles(id) ON DELETE CASCADE,
                                       permission_id UUID NOT NULL REFERENCES auth.permissions(id) ON DELETE CASCADE,
                                       PRIMARY KEY (role_id, permission_id)
);