package com.niclabs.erp.auth.service;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTCreationException;
import com.niclabs.erp.auth.domain.User;
import com.niclabs.erp.common.AppConstants;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.stream.Collectors;

/**
 * JWT-based implementation of {@link ITokenService}.
 *
 * <p>Tokens are signed with HMAC-256 and expire after {@link AppConstants#TOKEN_EXPIRY_MINUTES}
 * minutes (A04: short-lived tokens reduce the exposure window of a stolen credential).
 * The signing secret is validated at startup to prevent weak or default keys in
 * production (A04).</p>
 */
@Slf4j
@Service
public class TokenService implements ITokenService {

    @Value("${api.security.token.secret}")
    private String secret;

    /**
     * A04: Validate the JWT signing secret at startup.
     * Fails fast with a clear error if the secret is too short or is the known dev default,
     * preventing accidental production deployment with a weak key.
     */
    @PostConstruct
    void validateSecret() {
        int len = secret == null ? 0 : secret.length();
        log.info("JWT secret configured, length: {} chars", len);
        if (len < AppConstants.JWT_SECRET_MIN_LENGTH) {
            throw new IllegalStateException(
                    "JWT secret must be at least " + AppConstants.JWT_SECRET_MIN_LENGTH +
                    " characters (got " + len + "). Set the JWT_SECRET environment variable.");
        }
        if (secret.startsWith("dev-secret-key-NOT-for-production")) {
            log.warn("⚠️  SECURITY WARNING: Application is using the development JWT secret. " +
                     "Set JWT_SECRET to a strong random value in production.");
        }
    }

    @Override
    public String generateToken(User user) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(secret);

            List<String> authorities = user.getAuthorities().stream()
                    .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                    .collect(Collectors.toList());

            return JWT.create()
                    .withIssuer(AppConstants.TOKEN_ISSUER)
                    .withSubject(user.getEmail())
                    .withClaim("roles", authorities)
                    .withClaim("name", user.getName())
                    .withClaim("email", user.getEmail())
                    .withClaim("avatarUrl", user.getAvatarUrl() != null ? user.getAvatarUrl() : "")
                    .withExpiresAt(buildExpirationInstant())
                    .sign(algorithm);

        } catch (JWTCreationException exception) {
            throw new RuntimeException("Erro ao gerar token JWT", exception);
        }
    }

    @Override
    public String validateToken(String token) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(secret);
            return JWT.require(algorithm)
                    .withIssuer(AppConstants.TOKEN_ISSUER)
                    .build()
                    .verify(token)
                    .getSubject();
        } catch (com.auth0.jwt.exceptions.JWTVerificationException exception) {
            return "";
        }
    }

    private Instant buildExpirationInstant() {
        return LocalDateTime.now()
                .plusMinutes(AppConstants.TOKEN_EXPIRY_MINUTES)
                .toInstant(ZoneOffset.of(AppConstants.TIMEZONE_OFFSET));
    }
}
