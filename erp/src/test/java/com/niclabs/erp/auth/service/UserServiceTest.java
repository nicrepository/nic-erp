package com.niclabs.erp.auth.service;

import com.niclabs.erp.auth.domain.Role;
import com.niclabs.erp.auth.domain.User;
import com.niclabs.erp.auth.dto.RegisterDTO;
import com.niclabs.erp.auth.repository.PasswordResetTokenRepository;
import com.niclabs.erp.auth.repository.RoleRepository;
import com.niclabs.erp.auth.repository.UserRepository;
import com.niclabs.erp.exception.DuplicateResourceException;
import com.niclabs.erp.exception.ResourceNotFoundException;
import com.niclabs.erp.notification.service.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock UserRepository userRepository;
    @Mock RoleRepository roleRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock PasswordResetTokenRepository tokenRepository;
    @Mock EmailService emailService;

    @InjectMocks UserService userService;

    private RegisterDTO validDto;

    @BeforeEach
    void setUp() {
        validDto = new RegisterDTO("João Silva", "joao@email.com", "senha123");
    }

    @Test
    void registerUser_shouldThrow_whenEmailAlreadyExists() {
        when(userRepository.findByEmail("joao@email.com")).thenReturn(Optional.of(new User()));

        assertThatThrownBy(() -> userService.registerUser(validDto))
                .isInstanceOf(DuplicateResourceException.class);

        verify(userRepository, never()).save(any());
    }

    @Test
    void registerUser_shouldSucceed_whenEmailIsNew() {
        Role defaultRole = new Role();
        defaultRole.setName("ROLE_USER");

        when(userRepository.findByEmail("joao@email.com")).thenReturn(Optional.empty());
        when(roleRepository.findByName("ROLE_USER")).thenReturn(Optional.of(defaultRole));
        when(passwordEncoder.encode("senha123")).thenReturn("hashed");
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        User result = userService.registerUser(validDto);

        verify(userRepository).save(any());
        assertThat(result.getEmail()).isEqualTo("joao@email.com");
    }

    @Test
    void requestPasswordReset_shouldThrow_whenEmailNotFound() {
        when(userRepository.findByEmail("nao@existe.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.requestPasswordReset("nao@existe.com"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void resetPassword_shouldThrow_whenTokenNotFound() {
        when(tokenRepository.findByToken("invalid-token")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.resetPassword("invalid-token", "novaSenha"))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
