package com.niclabs.erp.announcement.repository;

import com.niclabs.erp.announcement.domain.Announcement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AnnouncementRepository extends JpaRepository<Announcement, UUID> {

    // Busca paginada ordenando do mais recente para o mais antigo
    Page<Announcement> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
