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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import com.niclabs.erp.helpdesk.dto.TicketResponseDTO;
import org.springframework.web.multipart.MultipartFile;

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
    public ResponseEntity<Page<TicketResponseDTO>> listTicketsByDepartment(
            @PathVariable String department,
            @PageableDefault(size = 10, page = 0) Pageable pageable) {
        try {
            TicketDepartment deptEnum = TicketDepartment.valueOf(department.toUpperCase());
            return ResponseEntity.ok(ticketService.listTicketsByDepartment(deptEnum, pageable));
        } catch (IllegalArgumentException e) {
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
    public ResponseEntity<Page<TicketResponseDTO>> getMyTickets(
            @PageableDefault(size = 10, page = 0) Pageable pageable) {
        return ResponseEntity.ok(ticketService.getMyTickets(pageable));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_TI') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Page<TicketResponseDTO>> getAllTickets(
            @PageableDefault(size = 10, page = 0) Pageable pageable) {
        return ResponseEntity.ok(ticketService.getAllTickets(pageable));
    }

    @PostMapping(value = "/{id}/attachments", consumes = "multipart/form-data")
    public ResponseEntity<TicketResponseDTO> uploadAttachment(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file) {

        return ResponseEntity.ok(ticketService.addAttachmentToTicket(id, file));
    }
}
