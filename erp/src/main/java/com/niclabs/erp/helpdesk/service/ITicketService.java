package com.niclabs.erp.helpdesk.service;

import com.niclabs.erp.helpdesk.domain.TicketDepartment;
import com.niclabs.erp.helpdesk.domain.TicketStatus;
import com.niclabs.erp.helpdesk.dto.TicketRequestDTO;
import com.niclabs.erp.helpdesk.dto.TicketResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

/**
 * Contract for helpdesk ticket lifecycle management.
 *
 * <p>Tickets follow the state machine: {@code OPEN} → {@code IN_PROGRESS} → {@code RESOLVED}.
 * When a ticket is resolved, an e-mail notification is sent asynchronously to the requester.</p>
 */
public interface ITicketService {

    /**
     * Opens a new helpdesk ticket on behalf of the currently authenticated user.
     *
     * @param dto ticket creation payload
     * @return the persisted ticket summary
     */
    TicketResponseDTO openTicket(TicketRequestDTO dto);

    /**
     * Returns a paginated list of tickets filtered by department.
     *
     * @param department department filter
     * @param pageable   pagination and sorting parameters
     * @return page of tickets for the given department
     */
    Page<TicketResponseDTO> listTicketsByDepartment(TicketDepartment department, Pageable pageable);

    /**
     * Assigns a ticket to the currently authenticated user (IT technician).
     * Automatically transitions {@code OPEN} tickets to {@code IN_PROGRESS}.
     *
     * @param ticketId target ticket identifier
     * @return updated ticket summary
     * @throws com.niclabs.erp.exception.ResourceNotFoundException if the ticket does not exist
     */
    TicketResponseDTO assignTicket(UUID ticketId);

    /**
     * Updates the status of a ticket. When the new status is {@code RESOLVED},
     * an e-mail is dispatched asynchronously to the original requester.
     *
     * @param ticketId  target ticket identifier
     * @param newStatus the desired new status
     * @return updated ticket summary
     * @throws com.niclabs.erp.exception.ResourceNotFoundException if the ticket or its requester is not found
     */
    TicketResponseDTO updateTicketStatus(UUID ticketId, TicketStatus newStatus);

    /**
     * Returns a paginated list of tickets opened by the currently authenticated user.
     *
     * @param pageable pagination and sorting parameters
     * @return page of the caller's tickets
     */
    Page<TicketResponseDTO> getMyTickets(Pageable pageable);

    /**
     * Returns a paginated list of all tickets in the system (IT admin view).
     *
     * @param pageable pagination and sorting parameters
     * @return page of all tickets
     */
    Page<TicketResponseDTO> getAllTickets(Pageable pageable);

    /**
     * Stores a file attachment and associates it with the given ticket.
     *
     * @param ticketId target ticket identifier
     * @param file     the multipart file to attach
     * @return updated ticket summary with the new attachment included
     * @throws com.niclabs.erp.exception.ResourceNotFoundException if the ticket does not exist
     */
    TicketResponseDTO addAttachmentToTicket(UUID ticketId, MultipartFile file);
}
