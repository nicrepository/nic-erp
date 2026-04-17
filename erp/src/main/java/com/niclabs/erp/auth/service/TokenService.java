package com.niclabs.erp.auth.service;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTCreationException;
import com.niclabs.erp.auth.domain.User;
import com.niclabs.erp.common.AppConstants;
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
 * <p>Tokens are signed with HMAC-256 and embed the user's e-mail, display name,
 * avatar URL, and the full authority list (roles + permissions) so the front-end
 * can make client-side authorization decisions without additional API calls.</p>
 */
@Service
public class TokenService implements ITokenService {

    /**
     * Signing secret sourced from the {@code JWT_SECRET} environment variable.
     * A safe development fallback is provided in {@code application.properties}.
     */
    @Value("${api.security.token.secret}")
    private String secret;

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
            // Return empty string on any validation failure — callers treat this as unauthenticated
            return "";
        }
    }

    private Instant buildExpirationInstant() {
        return LocalDateTime.now()
                .plusHours(AppConstants.TOKEN_EXPIRY_HOURS)
                .toInstant(ZoneOffset.of(AppConstants.TIMEZONE_OFFSET));
    }
}
