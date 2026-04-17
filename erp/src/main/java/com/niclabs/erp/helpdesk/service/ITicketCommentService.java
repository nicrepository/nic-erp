package com.niclabs.erp.helpdesk.service;

import com.niclabs.erp.helpdesk.dto.TicketCommentRequestDTO;
import com.niclabs.erp.helpdesk.dto.TicketCommentResponseDTO;

import java.util.List;
import java.util.UUID;

/**
 * Contract for helpdesk ticket comment management.
 *
 * <p>Comments provide a threaded conversation log on a ticket, visible to
 * both the requester and the assigned technician.</p>
 */
public interface ITicketCommentService {

    /**
     * Adds a comment to an existing ticket on behalf of the authenticated user.
     *
     * @param ticketId target ticket identifier
     * @param dto      comment payload
     * @return the persisted comment summary
     * @throws com.niclabs.erp.exception.ResourceNotFoundException if the ticket does not exist
     */
    TicketCommentResponseDTO addComment(UUID ticketId, TicketCommentRequestDTO dto);

    /**
     * Returns all comments for a ticket ordered by creation time ascending,
     * preserving the natural conversation order.
     *
     * @param ticketId target ticket identifier
     * @return chronological list of comments
     */
    List<TicketCommentResponseDTO> getCommentsByTicket(UUID ticketId);
}
