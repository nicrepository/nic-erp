package com.niclabs.erp.helpdesk.service;

import com.niclabs.erp.auth.domain.User;
import com.niclabs.erp.auth.repository.UserRepository;
import com.niclabs.erp.helpdesk.domain.Ticket;
import com.niclabs.erp.helpdesk.domain.TicketDepartment;
import com.niclabs.erp.helpdesk.domain.TicketStatus;
import com.niclabs.erp.helpdesk.dto.TicketRequestDTO;
import com.niclabs.erp.helpdesk.repository.TicketRepository;
import com.niclabs.erp.notification.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.niclabs.erp.helpdesk.dto.TicketResponseDTO;
import org.springframework.web.multipart.MultipartFile;
import com.niclabs.erp.storage.service.StorageService;
import com.niclabs.erp.helpdesk.dto.TicketResponseDTO;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final StorageService storageService;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Transactional
    public Ticket openTicket(TicketRequestDTO dto) {
        // Mágica do JWT: Pegamos o usuário logado diretamente do contexto de segurança
        User loggedInUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        Ticket ticket = new Ticket();
        ticket.setId(UUID.randomUUID());
        ticket.setTitle(dto.title());
        ticket.setDescription(dto.description());
        ticket.setPriority(dto.priority());
        ticket.setDepartment(dto.department()); // Agora o chamado sabe de qual departamento ele é!

        // Regras de negócio padrão para um novo chamado
        ticket.setStatus(TicketStatus.OPEN);
        ticket.setRequesterId(loggedInUser.getId());

        return ticketRepository.save(ticket);
    }

    // Método para listar chamados filtrando pelo departamento
    public Page<TicketResponseDTO> listTicketsByDepartment(TicketDepartment department, Pageable pageable) {
        return ticketRepository.findByDepartment(department, pageable)
                .map(TicketResponseDTO::fromEntity);
    }

    @Transactional
    public Ticket assignTicket(UUID ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Chamado não encontrado."));

        // Pegamos o técnico que está clicando em "Assumir"
        User loggedInUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        ticket.setAssigneeId(loggedInUser.getId());

        // Se o chamado estava apenas "Aberto", ele passa automaticamente para "Em Atendimento"
        if (ticket.getStatus() == TicketStatus.OPEN) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
        }

        return ticketRepository.save(ticket);
    }

    @Transactional
    public Ticket updateTicketStatus(UUID ticketId, TicketStatus newStatus) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Chamado não encontrado."));

        ticket.setStatus(newStatus);
        ticket = ticketRepository.save(ticket);

        // Se o novo status for RESOLVIDO, dispara o e-mail em segundo plano
        if (newStatus == TicketStatus.RESOLVED) {

            // Busca o usuário no banco para descobrir o e-mail dele
            User requester = userRepository.findById(ticket.getRequesterId())
                    .orElseThrow(() -> new RuntimeException("Usuário solicitante não encontrado."));

            // Pega os primeiros 8 caracteres do UUID para ficar um "Número de Chamado" mais amigável
            String shortId = ticket.getId().toString().substring(0, 8).toUpperCase();

            // Aciona o motor assíncrono
            emailService.sendTicketResolvedEmail(requester.getEmail(), shortId, ticket.getTitle());
        }

        return ticket;
    }

    public Page<TicketResponseDTO> getMyTickets(Pageable pageable) {
        User loggedInUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ticketRepository.findByRequesterIdOrderByCreatedAtDesc(loggedInUser.getId(), pageable)
                .map(TicketResponseDTO::fromEntity);
    }

    // Método novo para a fila geral de TI
    public Page<TicketResponseDTO> getAllTickets(Pageable pageable) {
        return ticketRepository.findAll(pageable)
                .map(TicketResponseDTO::fromEntity);
    }

    @Transactional
    public TicketResponseDTO addAttachmentToTicket(UUID ticketId, MultipartFile file) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Chamado não encontrado."));

        // 1. Manda o motor salvar o arquivo fisicamente no HD
        String generatedFileName = storageService.store(file);

        // 2. Adiciona o nome gerado na lista do chamado
        ticket.getAttachments().add(generatedFileName);

        ticketRepository.save(ticket);

        return TicketResponseDTO.fromEntity(ticket);
    }
}
