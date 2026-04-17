package com.niclabs.erp.announcement.service;

import com.niclabs.erp.announcement.domain.Announcement;
import com.niclabs.erp.announcement.dto.AnnouncementRequestDTO;
import com.niclabs.erp.announcement.dto.AnnouncementResponseDTO;
import com.niclabs.erp.announcement.repository.AnnouncementRepository;
import com.niclabs.erp.auth.domain.User;
import com.niclabs.erp.auth.repository.UserRepository;
import com.niclabs.erp.common.SecurityUtils;
import com.niclabs.erp.notification.service.IEmailService;
import com.niclabs.erp.notification.service.EmailService;
import com.niclabs.erp.storage.service.IStorageService;
import com.niclabs.erp.storage.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Manages company-wide announcements: creation with optional banner image and mass e-mail dispatch.
 *
 * <p>Write operations are wrapped in {@code @Transactional}. Read operations use
 * {@code readOnly = true} to skip dirty checking and optimise connection pool usage.</p>
 */
@Service
@RequiredArgsConstructor
public class AnnouncementService implements IAnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final UserRepository userRepository;
    private final IStorageService storageService;
    private final IEmailService emailService;

    /**
     * Creates an announcement, optionally stores a banner image, and sends a mass notification e-mail to all users.
     *
     * @param dto   announcement title and content
     * @param image optional banner image file; ignored when {@code null} or empty
     * @return the created {@link AnnouncementResponseDTO}
     */
    @Transactional
    public AnnouncementResponseDTO createAnnouncement(AnnouncementRequestDTO dto, MultipartFile image) {
        // 1. Pega quem está logado criando o aviso (ex: alguém do RH)
        User loggedInUser = SecurityUtils.getCurrentUser();
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

    /**
     * Returns a paginated, reverse-chronological list of announcements for the company notice board.
     *
     * @param pageable pagination and sort parameters
     * @return page of {@link AnnouncementResponseDTO}
     */
    @Transactional(readOnly = true)
    public Page<AnnouncementResponseDTO> getAnnouncements(Pageable pageable) {
        return announcementRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(AnnouncementResponseDTO::fromEntity);
    }
}
