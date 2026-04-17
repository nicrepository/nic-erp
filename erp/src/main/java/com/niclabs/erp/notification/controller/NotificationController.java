package com.niclabs.erp.notification.controller;

import com.niclabs.erp.auth.domain.User;
import com.niclabs.erp.auth.repository.UserRepository;
import com.niclabs.erp.notification.domain.Notification;
import com.niclabs.erp.notification.dto.NotificationResponseDTO;
import com.niclabs.erp.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * REST controller for user notification management.
 *
 * <p>Notifications are created internally by other modules (e.g. Helpdesk, HR) and
 * delivered to individual users. This controller exposes endpoints for the authenticated
 * user to retrieve and dismiss their own notifications.</p>
 */
@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    /**
     * Retrieves all unread notifications for the currently authenticated user,
     * ordered by creation time descending.
     *
     * @param principal the currently authenticated user
     * @return 200 OK with the list of unread {@link NotificationResponseDTO}
     */
    // Busca as notificações não lidas do usuário logado
    @GetMapping
    public ResponseEntity<List<NotificationResponseDTO>> getMyNotifications(Principal principal) {
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        List<NotificationResponseDTO> unread = notificationRepository
                .findByUserIdAndIsReadFalseOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(n -> new NotificationResponseDTO(n.getId(), n.getTitle(), n.getMessage(), n.getCreatedAt()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(unread);
    }

    /**
     * Marks a specific notification as read so it no longer appears in the unread list.
     *
     * @param id target notification identifier
     * @return 200 OK when the notification has been marked as read
     */
    // Marca uma notificação específica como lida
    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable UUID id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notificação não encontrada"));

        notification.setRead(true);
        notificationRepository.save(notification);

        return ResponseEntity.ok().build();
    }
}
