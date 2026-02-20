package com.niclabs.erp.config;

import com.niclabs.erp.auth.repository.UserRepository;
import com.niclabs.erp.auth.service.TokenService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class SecurityFilter extends OncePerRequestFilter {

    private final TokenService tokenService;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        // 1. Tenta extrair o token do cabeçalho da requisição
        var token = this.recoverToken(request);

        if (token != null) {
            // 2. Valida o token e pega o e-mail (subject)
            var login = tokenService.validateToken(token);

            if (!login.isEmpty()) {
                // 3. Busca o usuário no banco
                UserDetails user = userRepository.findByEmail(login)
                        .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

                // 4. Cria a autenticação e avisa o Spring Security que este usuário está logado na requisição atual
                var authentication = new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        }
        // 5. Passa a requisição para o próximo filtro ou para o Controller
        filterChain.doFilter(request, response);
    }

    private String recoverToken(HttpServletRequest request) {
        var authHeader = request.getHeader("Authorization");
        if (authHeader == null) return null;
        // O padrão da web é enviar "Bearer eyJhb..." então removemos a palavra "Bearer "
        return authHeader.replace("Bearer ", "");
    }
}
