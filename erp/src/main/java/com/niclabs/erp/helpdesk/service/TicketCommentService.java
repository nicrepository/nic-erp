package com.niclabs.erp.helpdesk.service;

import com.niclabs.erp.auth.domain.User;
import com.niclabs.erp.common.AppConstants;
import com.niclabs.erp.helpdesk.domain.Ticket;
import com.niclabs.erp.helpdesk.domain.TicketComment;
import com.niclabs.erp.common.SecurityUtils;
import com.niclabs.erp.helpdesk.dto.TicketCommentRequestDTO;
import com.niclabs.erp.helpdesk.dto.TicketCommentResponseDTO;
import com.niclabs.erp.helpdesk.repository.TicketCommentRepository;
import com.niclabs.erp.helpdesk.repository.TicketRepository;
import com.niclabs.erp.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Handles comments on helpdesk tickets, recording the author from the security context.
 *
 * <p>Write operations are wrapped in {@code @Transactional}. Read operations use
 * {@code readOnly = true} to skip dirty checking and optimise connection pool usage.</p>
 */
@Service
@RequiredArgsConstructor
public class TicketCommentService implements ITicketCommentService {

    private final TicketCommentRepository commentRepository;
    private final TicketRepository ticketRepository;

    /**
     * Adds a comment to a ticket, attributing it to the currently authenticated user.
     *
     * @param ticketId the ticket to comment on
     * @param dto      comment content
     * @return the created {@link TicketCommentResponseDTO}
     * @throws ResourceNotFoundException if no ticket exists with the given id
     */
    @Transactional
    public TicketCommentResponseDTO addComment(UUID ticketId, TicketCommentRequestDTO dto) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Chamado não encontrado."));

        User loggedInUser = SecurityUtils.getCurrentUser();
        ensureCanAccessTicket(ticket, loggedInUser);

        TicketComment comment = new TicketComment();
        comment.setId(UUID.randomUUID());
        comment.setTicketId(ticket.getId());
        comment.setAuthorId(loggedInUser.getId());
        comment.setContent(dto.content());

        return mapToDTO(commentRepository.save(comment));
    }

    /**
     * Returns all comments for a ticket in chronological order.
     *
     * @param ticketId ticket identifier
     * @return list of {@link TicketCommentResponseDTO}
     */
    @Transactional(readOnly = true)
    public List<TicketCommentResponseDTO> getCommentsByTicket(UUID ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Chamado não encontrado."));
        ensureCanAccessTicket(ticket, SecurityUtils.getCurrentUser());

        return commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId).stream()
                .map(this::mapToDTO)
                .toList();
    }

    private void ensureCanAccessTicket(Ticket ticket, User user) {
        boolean isRequester = ticket.getRequesterId().equals(user.getId());
        boolean isAssignee = ticket.getAssigneeId() != null && ticket.getAssigneeId().equals(user.getId());
        boolean isHelpdeskAgent = user.getAuthorities().stream()
                .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                .anyMatch(authority ->
                        authority.equals(AppConstants.ROLE_ADMIN) ||
                        authority.equals(AppConstants.ROLE_TI) ||
                        authority.equals(AppConstants.PERM_ACCESS_HELPDESK));

        if (!isRequester && !isAssignee && !isHelpdeskAgent) {
            throw new AccessDeniedException("Você não tem permissão para acessar este chamado.");
        }
    }

    private TicketCommentResponseDTO mapToDTO(TicketComment comment) {
        return new TicketCommentResponseDTO(
                comment.getId(),
                comment.getTicketId(),
                comment.getAuthorId(),
                comment.getContent(),
                comment.getCreatedAt()
        );
    }
}

