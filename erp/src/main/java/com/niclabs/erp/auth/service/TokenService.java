package com.niclabs.erp.auth.service;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTCreationException;
import com.niclabs.erp.auth.domain.Role;
import com.niclabs.erp.auth.domain.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
public class TokenService {

    // Lê uma chave secreta do application.properties (ou usa um padrão caso não encontre)
    @Value("${api.security.token.secret:minha-chave-secreta-dev}")
    private String secret;

    public String generateToken(User user) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(secret);

            List<String> roleNames = user.getRoles().stream()
                    .map(Role::getName)
                    .collect(java.util.stream.Collectors.toList());

            return JWT.create()
                    .withIssuer("nic-erp") // Quem está emitindo
                    .withSubject(user.getEmail()) // De quem é o token (e-mail)
                    .withClaim("roles", roleNames) // Cargos do usuário
                    .withClaim("name", user.getName()) // NOME PARA O REACT LER
                    .withClaim("email", user.getEmail()) // E-MAIL PARA O REACT LER
                    .withClaim("avatarUrl", user.getAvatarUrl() != null ? user.getAvatarUrl() : "") // FOTO SE EXISTIR
                    .withExpiresAt(genExpirationDate()) // Tempo de expiração
                    .sign(algorithm);
        } catch (JWTCreationException exception) {
            throw new RuntimeException("Erro ao gerar token JWT", exception);
        }
    }

    public String validateToken(String token) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(secret);
            return JWT.require(algorithm)
                    .withIssuer("nic-erp")
                    .build()
                    .verify(token)
                    .getSubject();
        } catch (com.auth0.jwt.exceptions.JWTVerificationException exception){
            return ""; // Retorna vazio se o token for inválido, expirado ou adulterado
        }
    }

    private Instant genExpirationDate() {
        // Token válido por 2 horas (para o Access Token)
        return LocalDateTime.now().plusHours(2).toInstant(ZoneOffset.of("-03:00"));
    }
}
