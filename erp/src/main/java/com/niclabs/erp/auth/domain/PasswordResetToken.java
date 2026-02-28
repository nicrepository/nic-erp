package com.niclabs.erp.auth.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "password_reset_tokens", schema = "auth")
@Getter
@Setter
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // O código único que vai na URL do e-mail
    @Column(nullable = false, unique = true)
    private String token;

    // A qual usuário esse token pertence
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    // Quando esse link vai expirar (ex: daqui a 2 horas)
    @Column(name = "expiry_date", nullable = false)
    private LocalDateTime expiryDate;
}
