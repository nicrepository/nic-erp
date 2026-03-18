package com.niclabs.erp.notification.repository;

import com.niclabs.erp.notification.domain.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    // Busca as notificações não lidas de um usuário específico
    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(UUID userId);
}
