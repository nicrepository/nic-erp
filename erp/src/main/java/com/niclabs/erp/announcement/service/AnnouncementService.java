package com.niclabs.erp.announcement.service;

import com.niclabs.erp.announcement.domain.Announcement;
import com.niclabs.erp.announcement.dto.AnnouncementRequestDTO;
import com.niclabs.erp.announcement.dto.AnnouncementResponseDTO;
import com.niclabs.erp.announcement.repository.AnnouncementRepository;
import com.niclabs.erp.auth.domain.User;
import com.niclabs.erp.auth.repository.UserRepository;
import com.niclabs.erp.notification.service.EmailService;
import com.niclabs.erp.storage.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;
    private final EmailService emailService;

    @Transactional
    public AnnouncementResponseDTO createAnnouncement(AnnouncementRequestDTO dto, MultipartFile image) {
        // 1. Pega quem está logado criando o aviso (ex: alguém do RH)
        User loggedInUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        Announcement announcement = new Announcement();
        announcement.setTitle(dto.title());
        announcement.setContent(dto.content());
        announcement.setAuthorId(loggedInUser.getId());

        // 2. Verifica se uma imagem foi enviada junto com o formulário
        if (image != null && !image.isEmpty()) {
            // Usa o seu motor de storage para salvar no HD e pega o nome gerado
            String fileName = storageService.store(image);
            announcement.setImageUrl(fileName);
        }

        // 3. Salva no banco de dados do PostgreSQL
        announcement = announcementRepository.save(announcement);

        // 4. Prepara a lista de e-mails para o disparo
        // (Em uma empresa gigante, faríamos uma Query específica só de e-mails, mas findAll() atende perfeitamente a Nic-Labs)
        List<String> emails = userRepository.findAll().stream()
                .map(User::getEmail)
                .toList();

        // 5. Aciona o motor assíncrono para enviar os e-mails sem travar a tela do usuário
        if (!emails.isEmpty()) {
            emailService.sendMassAnnouncementEmail(emails, dto.title(), dto.content());
        }

        return AnnouncementResponseDTO.fromEntity(announcement);
    }

    // Método para o Front-end desenhar o Mural com paginação
    public Page<AnnouncementResponseDTO> getAnnouncements(Pageable pageable) {
        return announcementRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(AnnouncementResponseDTO::fromEntity);
    }
}
