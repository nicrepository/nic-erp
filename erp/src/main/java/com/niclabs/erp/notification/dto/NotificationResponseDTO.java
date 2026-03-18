package com.niclabs.erp.notification.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record NotificationResponseDTO(
        UUID id,
        String title,
        String message,
        LocalDateTime createdAt
) {}
