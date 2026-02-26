package com.niclabs.erp.helpdesk.repository;

import com.niclabs.erp.helpdesk.domain.Ticket;
import com.niclabs.erp.helpdesk.domain.TicketDepartment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface TicketRepository extends JpaRepository<Ticket, UUID> {

    // Agora retorna uma Página de chamados por departamento
    Page<Ticket> findByDepartment(TicketDepartment department, Pageable pageable);

    // Agora retorna uma Página dos chamados do usuário logado
    Page<Ticket> findByRequesterIdOrderByCreatedAtDesc(UUID requesterId, Pageable pageable);

    long countByStatus(com.niclabs.erp.helpdesk.domain.TicketStatus status);
}