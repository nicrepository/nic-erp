package com.niclabs.erp.auth.controller;

import com.niclabs.erp.auth.domain.User;
import com.niclabs.erp.auth.dto.*;
import com.niclabs.erp.auth.service.IUserService;
import com.niclabs.erp.auth.service.ITokenService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

/**
 * Handles user authentication: registration, login, and password recovery.
 *
 * <p>The {@code /forgot-password} endpoint intentionally swallows exceptions to
 * prevent user enumeration — callers always receive HTTP 200 regardless of
 * whether the supplied e-mail matches an existing account.</p>
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticação", description = "Registro, login e recuperação de senha")
public class AuthController {

    private final IUserService userService;
    private final AuthenticationManager authenticationManager;
    private final ITokenService tokenService;

    /**
     * Registers a new user account with a default role assignment.
     *
     * @param data registration payload containing name, e-mail and raw password
     * @return 201 Created with a confirmation message
     */
    @PostMapping("/register")
    public ResponseEntity<String> register(@Valid @RequestBody RegisterDTO data) {
        userService.registerUser(data);
        return ResponseEntity.status(HttpStatus.CREATED).body("Usuário cadastrado com sucesso!");
    }

    /**
     * Authenticates a user with e-mail and password and returns a signed JWT.
     *
     * @param data login credentials
     * @return 200 OK with a {@link TokenDTO} containing the JWT
     */
    @PostMapping("/login")
    public ResponseEntity<TokenDTO> login(@Valid @RequestBody LoginDTO data) {
        UsernamePasswordAuthenticationToken credentials =
                new UsernamePasswordAuthenticationToken(data.email(), data.password());
        User user = (User) authenticationManager.authenticate(credentials).getPrincipal();
        String token = tokenService.generateToken(user);
        return ResponseEntity.ok(new TokenDTO(token, user.isMustChangePassword()));
    }

    /**
     * Validates that the caller holds a valid JWT and returns a confirmation message.
     *
     * @return 200 OK with a confirmation string when the token is valid
     */
    @GetMapping("/me")
    public ResponseEntity<String> getMyProfile() {
        return ResponseEntity.ok("Parabéns! Você acessou uma rota protegida usando um JWT válido!");
    }

    /**
     * Initiates a password reset flow by dispatching a reset e-mail to the supplied address.
     *
     * <p>Always returns 200 OK regardless of whether the e-mail matches an existing account
     * to prevent user enumeration.</p>
     *
     * @param dto payload containing the e-mail address to reset
     * @return 200 OK unconditionally
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequestDTO dto) {
        try {
            userService.requestPasswordReset(dto.email());
        } catch (Exception ignored) {
            // Silencia intencionalmente: não revela ao cliente se o e-mail existe ou não.
        }
        return ResponseEntity.ok().build();
    }

    /**
     * Completes a password reset using the one-time token received by e-mail.
     *
     * @param dto payload containing the reset token and the new plain-text password
     * @return 200 OK when the password has been changed successfully
     */
    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequestDTO dto) {
        userService.resetPassword(dto.token(), dto.newPassword());
        return ResponseEntity.ok().build();
    }
}
