package com.niclabs.erp.helpdesk.controller;

import com.niclabs.erp.helpdesk.domain.Ticket;
import com.niclabs.erp.helpdesk.domain.TicketDepartment;
import com.niclabs.erp.helpdesk.dto.TicketRequestDTO;
import com.niclabs.erp.helpdesk.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.niclabs.erp.helpdesk.domain.TicketComment;
import com.niclabs.erp.helpdesk.dto.TicketCommentRequestDTO;
import com.niclabs.erp.helpdesk.service.TicketCommentService;
import com.niclabs.erp.helpdesk.domain.TicketStatus;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/helpdesk/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;
    private final TicketCommentService commentService;

    @PostMapping
    public ResponseEntity<Ticket> openTicket(@RequestBody TicketRequestDTO dto) {
        Ticket createdTicket = ticketService.openTicket(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdTicket);
    }

    @GetMapping("/department/{department}")
    public ResponseEntity<List<Ticket>> listTicketsByDepartment(@PathVariable String department) {
        try {
            // Converte a string da URL para o nosso Enum (ex: "IT", "ADMIN")
            TicketDepartment deptEnum = TicketDepartment.valueOf(department.toUpperCase());
            List<Ticket> tickets = ticketService.listTicketsByDepartment(deptEnum);
            return ResponseEntity.ok(tickets);
        } catch (IllegalArgumentException e) {
            // Se o usuário digitar um departamento que não existe no Enum, retorna 400 Bad Request
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{ticketId}/comments")
    public ResponseEntity<TicketComment> addComment(
            @PathVariable UUID ticketId,
            @RequestBody TicketCommentRequestDTO dto) {

        TicketComment comment = commentService.addComment(ticketId, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }

    @GetMapping("/{ticketId}/comments")
    public ResponseEntity<List<TicketComment>> getComments(@PathVariable UUID ticketId) {
        return ResponseEntity.ok(commentService.getCommentsByTicket(ticketId));
    }

    @PreAuthorize("hasRole('TI') or hasRole('ADMIN')")
    @PutMapping("/{id}/assign")
    public ResponseEntity<Ticket> assignTicket(@PathVariable UUID id) {
        Ticket updatedTicket = ticketService.assignTicket(id);
        return ResponseEntity.ok(updatedTicket);
    }

    @PreAuthorize("hasRole('TI') or hasRole('ADMIN')")
    @PutMapping("/{id}/status")
    public ResponseEntity<Ticket> updateTicketStatus(
            @PathVariable UUID id,
            @RequestParam TicketStatus status) {

        Ticket updatedTicket = ticketService.updateTicketStatus(id, status);
        return ResponseEntity.ok(updatedTicket);
    }

    @GetMapping("/my")
    public ResponseEntity<List<Ticket>> getMyTickets() {
        return ResponseEntity.ok(ticketService.getMyTickets());
    }
}
