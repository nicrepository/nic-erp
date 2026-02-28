package com.niclabs.erp.announcement.dto;

import com.niclabs.erp.announcement.domain.Announcement;
import java.time.LocalDateTime;
import java.util.UUID;

public record AnnouncementResponseDTO(
        UUID id,
        String title,
        String content,
        String imageUrl,
        UUID authorId,
        LocalDateTime createdAt
) {
    public static AnnouncementResponseDTO fromEntity(Announcement announcement) {
        return new AnnouncementResponseDTO(
                announcement.getId(),
                announcement.getTitle(),
                announcement.getContent(),
                announcement.getImageUrl(),
                announcement.getAuthorId(),
                announcement.getCreatedAt()
        );
    }
}
