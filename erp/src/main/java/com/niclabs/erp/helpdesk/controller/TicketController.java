package com.niclabs.erp.helpdesk.controller;

import com.niclabs.erp.helpdesk.domain.TicketDepartment;
import com.niclabs.erp.helpdesk.dto.TicketRequestDTO;
import com.niclabs.erp.helpdesk.dto.TicketCommentRequestDTO;
import com.niclabs.erp.helpdesk.dto.TicketCommentResponseDTO;
import com.niclabs.erp.helpdesk.dto.TicketResponseDTO;
import com.niclabs.erp.helpdesk.service.ITicketService;
import com.niclabs.erp.helpdesk.service.ITicketCommentService;
import com.niclabs.erp.helpdesk.domain.TicketStatus;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for helpdesk ticket lifecycle management.
 *
 * <p>End-users can open tickets and add comments. IT staff with the
 * {@code ACCESS_HELPDESK} authority can assign tickets and update their status.</p>
 */
@RestController
@RequestMapping("/helpdesk/tickets")
@RequiredArgsConstructor
@Tag(name = "Helpdesk", description = "Abertura e gestão de tickets de suporte")
public class TicketController {

    private final ITicketService ticketService;
    private final ITicketCommentService commentService;

    /**
     * Opens a new helpdesk ticket on behalf of the currently authenticated user.
     *
     * @param dto ticket creation payload including title, description, and department
     * @return 201 Created with the persisted {@link TicketResponseDTO}
     */
    @PostMapping
    public ResponseEntity<TicketResponseDTO> openTicket(@Valid @RequestBody TicketRequestDTO dto) {
        TicketResponseDTO createdTicket = ticketService.openTicket(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdTicket);
    }

    /**
     * Retrieves a paginated list of tickets filtered by department.
     *
     * @param department department name (case-insensitive, e.g. {@code "TI"})
     * @param pageable   pagination and sort parameters
     * @return 200 OK with a page of {@link TicketResponseDTO}
     */
    @GetMapping("/department/{department}")
    public ResponseEntity<Page<TicketResponseDTO>> listTicketsByDepartment(
            @PathVariable String department,
            @PageableDefault(size = 10, page = 0) Pageable pageable) {
        TicketDepartment deptEnum = TicketDepartment.valueOf(department.toUpperCase());
        return ResponseEntity.ok(ticketService.listTicketsByDepartment(deptEnum, pageable));
    }

    /**
     * Adds a comment to an existing ticket on behalf of the authenticated user.
     *
     * @param ticketId target ticket identifier
     * @param dto      comment payload containing the message text
     * @return 201 Created with the persisted {@link TicketCommentResponseDTO}
     */
    @PostMapping("/{ticketId}/comments")
    public ResponseEntity<TicketCommentResponseDTO> addComment(
            @PathVariable UUID ticketId,
            @Valid @RequestBody TicketCommentRequestDTO dto) {

        TicketCommentResponseDTO comment = commentService.addComment(ticketId, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }

    /**
     * Retrieves all comments for a ticket in chronological order.
     *
     * @param ticketId target ticket identifier
     * @return 200 OK with the list of {@link TicketCommentResponseDTO}
     */
    @GetMapping("/{ticketId}/comments")
    public ResponseEntity<List<TicketCommentResponseDTO>> getComments(@PathVariable UUID ticketId) {
        return ResponseEntity.ok(commentService.getCommentsByTicket(ticketId));
    }

    /**
     * Assigns a ticket to the currently authenticated technician and transitions
     * its status from {@code OPEN} to {@code IN_PROGRESS}.
     *
     * @param id target ticket identifier
     * @return 200 OK with the updated {@link TicketResponseDTO}
     */
    @PreAuthorize("hasAuthority('ACCESS_HELPDESK') or hasAuthority('ROLE_ADMIN')")
    @PutMapping("/{id}/assign")
    public ResponseEntity<TicketResponseDTO> assignTicket(@PathVariable UUID id) {
        TicketResponseDTO updatedTicket = ticketService.assignTicket(id);
        return ResponseEntity.ok(updatedTicket);
    }

    /**
     * Updates the status of a ticket. When set to {@code RESOLVED}, an e-mail
     * is dispatched asynchronously to the original requester.
     *
     * @param id     target ticket identifier
     * @param status the desired new {@link TicketStatus}
     * @return 200 OK with the updated {@link TicketResponseDTO}
     */
    @PreAuthorize("hasAuthority('ACCESS_HELPDESK') or hasAuthority('ROLE_ADMIN')")
    @PutMapping("/{id}/status")
    public ResponseEntity<TicketResponseDTO> updateTicketStatus(
            @PathVariable UUID id,
            @RequestParam TicketStatus status) {

        TicketResponseDTO updatedTicket = ticketService.updateTicketStatus(id, status);
        return ResponseEntity.ok(updatedTicket);
    }

    /**
     * Retrieves a paginated list of tickets opened by the currently authenticated user.
     *
     * @param pageable pagination and sort parameters
     * @return 200 OK with a page of {@link TicketResponseDTO}
     */
    @GetMapping("/my")
    public ResponseEntity<Page<TicketResponseDTO>> getMyTickets(
            @PageableDefault(size = 10, page = 0) Pageable pageable) {
        return ResponseEntity.ok(ticketService.getMyTickets(pageable));
    }

    /**
     * Retrieves a paginated list of all tickets in the system (IT admin view).
     *
     * @param pageable pagination and sort parameters
     * @return 200 OK with a page of {@link TicketResponseDTO}
     */
    @GetMapping
    @PreAuthorize("hasAuthority('ACCESS_HELPDESK') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Page<TicketResponseDTO>> getAllTickets(
            @PageableDefault(size = 10, page = 0) Pageable pageable) {
        return ResponseEntity.ok(ticketService.getAllTickets(pageable));
    }

    /**
     * Uploads a file attachment and associates it with the specified ticket.
     *
     * @param id   target ticket identifier
     * @param file the file to attach (multipart/form-data)
     * @return 200 OK with the updated {@link TicketResponseDTO} including the new attachment
     */
    @PostMapping(value = "/{id}/attachments", consumes = "multipart/form-data")
    public ResponseEntity<TicketResponseDTO> uploadAttachment(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file) {

        return ResponseEntity.ok(ticketService.addAttachmentToTicket(id, file));
    }
}
