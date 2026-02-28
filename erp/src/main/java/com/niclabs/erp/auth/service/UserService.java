package com.niclabs.erp.auth.service;

import com.niclabs.erp.auth.domain.Role;
import com.niclabs.erp.auth.domain.User;
import com.niclabs.erp.auth.dto.RegisterDTO;
import com.niclabs.erp.auth.dto.UserResponseDTO;
import com.niclabs.erp.auth.repository.RoleRepository;
import com.niclabs.erp.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.niclabs.erp.auth.domain.PasswordResetToken;
import com.niclabs.erp.auth.repository.PasswordResetTokenRepository;
import com.niclabs.erp.notification.service.EmailService;
import java.time.LocalDateTime;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.HashSet;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailService emailService;

    // --- SEU MÉTODO EXISTENTE ---
    public User registerUser(RegisterDTO data) {
        if (userRepository.findByEmail(data.email()).isPresent()) {
            throw new RuntimeException("E-mail já cadastrado no sistema.");
        }

        User newUser = new User();
        newUser.setId(UUID.randomUUID());
        newUser.setName(data.name());
        newUser.setEmail(data.email());
        newUser.setPassword(passwordEncoder.encode(data.password()));
        newUser.setActive(true);

        // Dica: Se quiser definir uma role padrão (ex: USER) ao registrar, faça aqui.
        // Por enquanto, deixamos sem role ou com a lógica que preferir.

        return userRepository.save(newUser);
    }

    // --- NOVOS MÉTODOS DE GESTÃO ---

    public List<UserResponseDTO> listAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserResponseDTO updateUserRole(UUID userId, String roleName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));

        // Busca a role no banco pelo nome (ex: "ROLE_TI")
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Cargo '" + roleName + "' não encontrado."));

        user.setRoles(new HashSet<>(List.of(role)));

        userRepository.save(user);
        return mapToDTO(user);
    }

    // Método auxiliar para converter User -> UserResponseDTO
    private UserResponseDTO mapToDTO(User user) {
        // Extrai apenas os nomes das roles (String) da lista de objetos Role
        List<String> roleNames = user.getRoles() != null
                ? user.getRoles().stream().map(Role::getName).collect(Collectors.toList())
                : List.of();

        return new UserResponseDTO(user.getId(), user.getName(), user.getEmail(), roleNames);
    }

    @Transactional
    public void requestPasswordReset(String email) {
        // 1. Verifica se o e-mail existe no sistema
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));

        // 2. Gera um token aleatório e difícil de adivinhar
        String token = UUID.randomUUID().toString();

        // 3. Monta o objeto e salva no banco de dados
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUserId(user.getId());
        resetToken.setExpiryDate(LocalDateTime.now().plusHours(2)); // Validade de 2 horas

        tokenRepository.save(resetToken);

        // 4. Dispara o e-mail em segundo plano!
        emailService.sendPasswordResetEmail(user.getEmail(), token);
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        // 1. Busca o token no banco de dados
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Token inválido ou não encontrado."));

        // 2. Verifica se o prazo de 2 horas já passou
        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            tokenRepository.delete(resetToken); // Limpa o lixo do banco
            throw new RuntimeException("Este link de recuperação já expirou.");
        }

        // 3. Encontra o dono daquele token
        User user = userRepository.findById(resetToken.getUserId())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));

        // 4. Criptografa a nova senha com BCrypt e salva
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // 5. Queima o token! (Regra de ouro de segurança)
        tokenRepository.delete(resetToken);
    }
}
