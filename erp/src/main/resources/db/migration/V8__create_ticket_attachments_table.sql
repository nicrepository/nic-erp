CREATE TABLE helpdesk.ticket_attachments (
                                             ticket_id UUID NOT NULL,
                                             file_name VARCHAR(255) NOT NULL,
                                             CONSTRAINT fk_ticket_attachments_ticket_id FOREIGN KEY (ticket_id) REFERENCES helpdesk.tickets (id) ON DELETE CASCADE
);