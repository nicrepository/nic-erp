package com.niclabs.erp.helpdesk.repository;

import com.niclabs.erp.helpdesk.domain.Ticket;
import com.niclabs.erp.helpdesk.domain.TicketDepartment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TicketRepository extends JpaRepository<Ticket, UUID> {

    // O Spring cria o comando SQL automaticamente (SELECT * FROM tickets WHERE department = ?)
    List<Ticket> findByDepartment(TicketDepartment department);

}