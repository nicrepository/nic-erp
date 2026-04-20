package com.niclabs.erp.helpdesk.service;

import com.niclabs.erp.auth.domain.User;
import com.niclabs.erp.auth.repository.UserRepository;
import com.niclabs.erp.common.SecurityUtils;
import com.niclabs.erp.helpdesk.domain.Ticket;
import com.niclabs.erp.helpdesk.domain.TicketCategory;
import com.niclabs.erp.helpdesk.domain.TicketDepartment;
import com.niclabs.erp.helpdesk.domain.TicketStatus;
import com.niclabs.erp.helpdesk.dto.TicketRequestDTO;
import com.niclabs.erp.helpdesk.dto.TicketResponseDTO;
import com.niclabs.erp.helpdesk.repository.TicketCategoryRepository;
import com.niclabs.erp.helpdesk.repository.TicketRepository;
import com.niclabs.erp.exception.ResourceNotFoundException;
import com.niclabs.erp.notification.service.IEmailService;
import com.niclabs.erp.notification.service.EmailService;
import com.niclabs.erp.storage.service.IStorageService;
import com.niclabs.erp.storage.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

/**
 * Manages the helpdesk ticket lifecycle: opening, assignment, status transitions, and file attachments.
 *
 * <p>Write operations are wrapped in {@code @Transactional}. Read operations use
 * {@code readOnly = true} to skip dirty checking and optimise connection pool usage.</p>
 */
@Service
@RequiredArgsConstructor
public class TicketService implements ITicketService {

    private final TicketRepository ticketRepository;
    private final TicketCategoryRepository ticketCategoryRepository;
    private final IStorageService storageService;
    private final UserRepository userRepository;
    private final IEmailService emailService;

    /**
     * Opens a new support ticket on behalf of the currently authenticated user.
     *
     * @param dto ticket data including title, description, priority, and department
     * @return the created {@link TicketResponseDTO}
     */
    @Transactional
    public TicketResponseDTO openTicket(TicketRequestDTO dto) {
        User loggedInUser = SecurityUtils.getCurrentUser();

        TicketCategory category = ticketCategoryRepository.findById(dto.categoryId())
                .filter(TicketCategory::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada ou inativa."));

        Ticket ticket = new Ticket();
        ticket.setId(UUID.randomUUID());
        ticket.setTitle(dto.title());
        ticket.setDescription(dto.description());
        ticket.setPriority(category.getPriority());
        ticket.setDepartment(category.getDepartment());
        ticket.setCategoryId(category.getId());
        ticket.setStatus(TicketStatus.OPEN);
        ticket.setRequesterId(loggedInUser.getId());

        return TicketResponseDTO.fromEntity(ticketRepository.save(ticket), category);
    }

    /**
     * Returns a paginated list of tickets filtered by department.
     *
     * @param department target department queue
     * @param pageable   pagination and sort parameters
     * @return page of {@link TicketResponseDTO}
     */
    @Transactional(readOnly = true)
    public Page<TicketResponseDTO> listTicketsByDepartment(TicketDepartment department, Pageable pageable) {
        return ticketRepository.findByDepartment(department, pageable)
                .map(TicketResponseDTO::fromEntity);
    }

    /**
     * Assigns the ticket to the currently authenticated agent and moves it to {@code IN_PROGRESS} if still open.
     *
     * @param ticketId ticket identifier
     * @return updated {@link TicketResponseDTO}
     * @throws ResourceNotFoundException if no ticket exists with the given id
     */
    @Transactional
    public TicketResponseDTO assignTicket(UUID ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Chamado não encontrado."));

        User loggedInUser = SecurityUtils.getCurrentUser();
        ticket.setAssigneeId(loggedInUser.getId());

        if (ticket.getStatus() == TicketStatus.OPEN) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
        }

        return TicketResponseDTO.fromEntity(ticketRepository.save(ticket));
    }

    /**
     * Transitions a ticket to a new status and sends a resolution e-mail when the status is {@code RESOLVED}.
     *
     * @param ticketId  ticket identifier
     * @param newStatus desired target status
     * @return updated {@link TicketResponseDTO}
     * @throws ResourceNotFoundException if the ticket or its requester does not exist
     */
    @Transactional
    public TicketResponseDTO updateTicketStatus(UUID ticketId, TicketStatus newStatus) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Chamado não encontrado."));

        ticket.setStatus(newStatus);
        ticket = ticketRepository.save(ticket);

        if (newStatus == TicketStatus.RESOLVED) {
            User requester = userRepository.findById(ticket.getRequesterId())
                    .orElseThrow(() -> new ResourceNotFoundException("Usuário solicitante não encontrado."));

            String shortId = ticket.getId().toString().substring(0, 8).toUpperCase();
            emailService.sendTicketResolvedEmail(requester.getEmail(), shortId, ticket.getTitle());
        }

        return TicketResponseDTO.fromEntity(ticket);
    }

    /**
     * Returns a paginated list of tickets opened by the currently authenticated user.
     *
     * @param pageable pagination and sort parameters
     * @return page of {@link TicketResponseDTO}
     */
    @Transactional(readOnly = true)
    public Page<TicketResponseDTO> getMyTickets(Pageable pageable) {
        User loggedInUser = SecurityUtils.getCurrentUser();
        return ticketRepository.findByRequesterIdOrderByCreatedAtDesc(loggedInUser.getId(), pageable)
                .map(TicketResponseDTO::fromEntity);
    }

    /**
     * Returns a paginated list of all tickets across all departments (IT queue view).
     *
     * @param pageable pagination and sort parameters
     * @return page of {@link TicketResponseDTO}
     */
    @Transactional(readOnly = true)
    public Page<TicketResponseDTO> getAllTickets(Pageable pageable) {
        return ticketRepository.findAll(pageable)
                .map(TicketResponseDTO::fromEntity);
    }

    /**
     * Stores an uploaded file and associates it with the given ticket.
     *
     * @param ticketId ticket identifier
     * @param file     the file to attach
     * @return updated {@link TicketResponseDTO} containing the new attachment name
     * @throws ResourceNotFoundException if no ticket exists with the given id
     */
    @Transactional
    public TicketResponseDTO addAttachmentToTicket(UUID ticketId, MultipartFile file) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Chamado não encontrado."));

        // 1. Manda o motor salvar o arquivo fisicamente no HD
        String generatedFileName = storageService.store(file);

        // 2. Adiciona o nome gerado na lista do chamado
        ticket.getAttachments().add(generatedFileName);

        ticketRepository.save(ticket);

        return TicketResponseDTO.fromEntity(ticket);
    }
}
