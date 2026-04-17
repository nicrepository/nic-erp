package com.niclabs.erp.announcement.controller;

import com.niclabs.erp.announcement.dto.AnnouncementRequestDTO;
import com.niclabs.erp.announcement.dto.AnnouncementResponseDTO;
import com.niclabs.erp.announcement.service.IAnnouncementService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.access.prepost.PreAuthorize;

/**
 * REST controller for company announcement (mural) management.
 *
 * <p>Announcements are visible to all authenticated users. Publishing a new
 * announcement triggers an asynchronous mass e-mail notification to all registered users.
 * Management operations require the {@code ACCESS_ANNOUNCEMENTS_MANAGE} or
 * {@code ROLE_ADMIN} authority.</p>
 */
@RestController
@RequestMapping("/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final IAnnouncementService announcementService;

    /**
     * Creates and publishes a new company announcement.
     *
     * <p>An optional cover image can be attached. All registered users are notified
     * asynchronously via e-mail after publication.</p>
     *
     * @param title   announcement title
     * @param content announcement body text
     * @param image   optional cover image (multipart/form-data, may be omitted)
     * @return 201 Created with the persisted {@link AnnouncementResponseDTO}
     */
    // A anotação "consumes" garante que essa rota só aceita requisições com arquivos anexos (form-data)
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('ACCESS_ANNOUNCEMENTS_MANAGE') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<AnnouncementResponseDTO> createAnnouncement(
            @RequestParam("title") String title,
            @RequestParam("content") String content,
            @RequestParam(value = "image", required = false) MultipartFile image) {

        // Instanciamos o DTO de forma limpa
        AnnouncementRequestDTO dto = new AnnouncementRequestDTO(title, content);

        AnnouncementResponseDTO createdAnnouncement = announcementService.createAnnouncement(dto, image);

        return ResponseEntity.status(HttpStatus.CREATED).body(createdAnnouncement);
    }

    /**
     * Retrieves a paginated list of all announcements ordered by creation time descending.
     *
     * @param pageable pagination parameters (default: page 0, size 5)
     * @return 200 OK with a page of {@link AnnouncementResponseDTO}
     */
    // Rota para o Front-end buscar os avisos paginados (5 por vez)
    @GetMapping
    public ResponseEntity<Page<AnnouncementResponseDTO>> getAnnouncements(
            @PageableDefault(size = 5, page = 0) Pageable pageable) {

        return ResponseEntity.ok(announcementService.getAnnouncements(pageable));
    }
}
