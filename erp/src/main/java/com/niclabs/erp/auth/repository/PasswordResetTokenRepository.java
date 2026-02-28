package com.niclabs.erp.auth.repository;

import com.niclabs.erp.auth.domain.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {

    // Busca o token no banco para validarmos se ele existe e se não expirou
    Optional<PasswordResetToken> findByToken(String token);
}
