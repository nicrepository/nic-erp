-- Criação do schema lógico para isolar o módulo de chamados
CREATE SCHEMA IF NOT EXISTS helpdesk;

-- Tabela principal de Chamados
CREATE TABLE helpdesk.tickets (
                                  id UUID PRIMARY KEY,
                                  title VARCHAR(255) NOT NULL,
                                  description TEXT NOT NULL,
                                  status VARCHAR(50) NOT NULL,
                                  priority VARCHAR(50) NOT NULL,
                                  requester_id UUID NOT NULL REFERENCES auth.users(id),
                                  assignee_id UUID REFERENCES auth.users(id),
                                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para os Comentários/Interações dentro do chamado
CREATE TABLE helpdesk.ticket_comments (
                                          id UUID PRIMARY KEY,
                                          ticket_id UUID NOT NULL REFERENCES helpdesk.tickets(id) ON DELETE CASCADE,
                                          author_id UUID NOT NULL REFERENCES auth.users(id),
                                          content TEXT NOT NULL,
                                          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);