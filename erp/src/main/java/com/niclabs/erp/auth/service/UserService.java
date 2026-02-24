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
}
