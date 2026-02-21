package com.niclabs.erp.helpdesk.repository;

import com.niclabs.erp.helpdesk.domain.TicketComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TicketCommentRepository extends JpaRepository<TicketComment, UUID> {

    // O Spring gera a query de busca pelo ID do chamado e já ordena pela data!
    List<TicketComment> findByTicketIdOrderByCreatedAtAsc(UUID ticketId);

}
