package com.niclabs.erp.helpdesk.service;

import com.niclabs.erp.auth.domain.User;
import com.niclabs.erp.helpdesk.domain.Ticket;
import com.niclabs.erp.helpdesk.domain.TicketComment;
import com.niclabs.erp.helpdesk.dto.TicketCommentRequestDTO;
import com.niclabs.erp.helpdesk.repository.TicketCommentRepository;
import com.niclabs.erp.helpdesk.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TicketCommentService {

    private final TicketCommentRepository commentRepository;
    private final TicketRepository ticketRepository;

    @Transactional
    public TicketComment addComment(UUID ticketId, TicketCommentRequestDTO dto) {
        // 1. Verifica se o chamado realmente existe
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Chamado não encontrado."));

        // 2. Identifica quem está comentando (mágica do JWT)
        User loggedInUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        // 3. Monta e salva o comentário
        TicketComment comment = new TicketComment();
        comment.setId(UUID.randomUUID());
        comment.setTicketId(ticket.getId());
        comment.setAuthorId(loggedInUser.getId());
        comment.setContent(dto.content());

        return commentRepository.save(comment);
    }

    public List<TicketComment> getCommentsByTicket(UUID ticketId) {
        return commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId);
    }
}
