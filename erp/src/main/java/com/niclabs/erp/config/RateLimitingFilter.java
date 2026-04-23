package com.niclabs.erp.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;

/**
 * A06/A07: Sliding-window rate limiter that protects authentication endpoints from
 * brute-force and credential-stuffing attacks.
 *
 * <p>Limits are applied per client IP (resolved via X-Forwarded-For for Traefik):
 * <ul>
 *   <li>{@code POST /auth/login} — 5 attempts per 60 seconds</li>
 *   <li>{@code POST /auth/forgot-password} — 3 attempts per 900 seconds</li>
 * </ul>
 *
 * <p>Exceeding a limit returns HTTP 429 with a JSON error body.
 * The filter runs before Spring Security ({@link Ordered#HIGHEST_PRECEDENCE}).
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final String LOGIN_PATH = "/auth/login";
    private static final String FORGOT_PATH = "/auth/forgot-password";

    private static final int LOGIN_MAX_ATTEMPTS   = 5;
    private static final long LOGIN_WINDOW_MS     = 60_000L;

    private static final int FORGOT_MAX_ATTEMPTS  = 3;
    private static final long FORGOT_WINDOW_MS    = 900_000L;

    // key = "<path>:<ip>", value = sliding window of request timestamps
    private final ConcurrentHashMap<String, Deque<Long>> requestLog = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String path = request.getServletPath();
        String method = request.getMethod();

        if ("POST".equalsIgnoreCase(method)) {
            if (path.equals(LOGIN_PATH) && isRateLimited(request, LOGIN_PATH, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS)) {
                sendTooManyRequests(response, "Muitas tentativas de login. Aguarde 1 minuto.");
                return;
            }
            if (path.equals(FORGOT_PATH) && isRateLimited(request, FORGOT_PATH, FORGOT_MAX_ATTEMPTS, FORGOT_WINDOW_MS)) {
                sendTooManyRequests(response, "Muitas solicitações de redefinição. Aguarde 15 minutos.");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean isRateLimited(HttpServletRequest request, String path, int maxAttempts, long windowMs) {
        String ip = resolveClientIp(request);
        String key = path + ":" + ip;
        long now = System.currentTimeMillis();

        Deque<Long> timestamps = requestLog.computeIfAbsent(key, k -> new ArrayDeque<>());

        synchronized (timestamps) {
            // Discard entries outside the current window
            while (!timestamps.isEmpty() && now - timestamps.peekFirst() > windowMs) {
                timestamps.pollFirst();
            }

            if (timestamps.size() >= maxAttempts) {
                return true;
            }

            timestamps.addLast(now);
            return false;
        }
    }

    /**
     * Resolves the real client IP, preferring the {@code X-Forwarded-For} header set by Traefik.
     * Only the first (leftmost) IP is used to prevent header spoofing by the client.
     */
    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private void sendTooManyRequests(HttpServletResponse response, String message) throws IOException {
        response.setStatus(429);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"error\":\"" + message + "\"}");
    }
}
