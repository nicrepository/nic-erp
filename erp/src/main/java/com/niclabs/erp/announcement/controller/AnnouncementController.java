package com.niclabs.erp.announcement.controller;

import com.niclabs.erp.announcement.dto.AnnouncementRequestDTO;
import com.niclabs.erp.announcement.dto.AnnouncementResponseDTO;
import com.niclabs.erp.announcement.service.AnnouncementService;
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

@RestController
@RequestMapping("/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;

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

    // Rota para o Front-end buscar os avisos paginados (5 por vez)
    @GetMapping
    public ResponseEntity<Page<AnnouncementResponseDTO>> getAnnouncements(
            @PageableDefault(size = 5, page = 0) Pageable pageable) {

        return ResponseEntity.ok(announcementService.getAnnouncements(pageable));
    }
}
