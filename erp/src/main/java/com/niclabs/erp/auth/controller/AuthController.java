package com.niclabs.erp.auth.controller;

import com.niclabs.erp.auth.domain.User;
import com.niclabs.erp.auth.dto.*;
import com.niclabs.erp.auth.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final org.springframework.security.authentication.AuthenticationManager authenticationManager;
    private final com.niclabs.erp.auth.service.TokenService tokenService;

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterDTO data) {
        try {
            userService.registerUser(data);
            return ResponseEntity.status(HttpStatus.CREATED).body("Usuário cadastrado com sucesso!");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<TokenDTO> login(@RequestBody LoginDTO data) {
        var usernamePassword = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(data.email(), data.password());
        var auth = this.authenticationManager.authenticate(usernamePassword);

        var token = tokenService.generateToken((User) auth.getPrincipal());

        return ResponseEntity.ok(new TokenDTO(token));
    }

    @GetMapping("/me")
    public ResponseEntity<String> getMyProfile() {
        return ResponseEntity.ok("Parabéns! Você acessou uma rota protegida usando um JWT válido!");
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@RequestBody ForgotPasswordRequestDTO dto) {

        userService.requestPasswordReset(dto.email());

        // Retornamos apenas um 200 OK sem mensagem no corpo.
        // Dica de Segurança: Nunca informamos se o e-mail existe ou não na base de dados
        // para evitar que hackers descubram quem tem conta no seu ERP!
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody ResetPasswordRequestDTO dto) {

        userService.resetPassword(dto.token(), dto.newPassword());

        return ResponseEntity.ok("Senha redefinida com sucesso!");
    }
}
