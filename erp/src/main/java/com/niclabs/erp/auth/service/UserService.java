package com.niclabs.erp.auth.service;

import com.niclabs.erp.auth.domain.User;
import com.niclabs.erp.auth.dto.RegisterDTO;
import com.niclabs.erp.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User registerUser(RegisterDTO data) {
        // Verifica se o email já existe para evitar erros no banco
        if (userRepository.findByEmail(data.email()).isPresent()) {
            throw new RuntimeException("E-mail já cadastrado no sistema.");
        }

        // Cria a nova entidade User e criptografa a senha com BCrypt
        User newUser = new User();
        newUser.setId(UUID.randomUUID());
        newUser.setName(data.name());
        newUser.setEmail(data.email());
        newUser.setPassword(passwordEncoder.encode(data.password()));
        newUser.setActive(true);

        return userRepository.save(newUser);
    }
}
