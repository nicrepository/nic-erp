package com.niclabs.erp.auth.service;

import com.niclabs.erp.auth.domain.Role;
import com.niclabs.erp.auth.domain.User;
import com.niclabs.erp.auth.dto.RegisterDTO;
import com.niclabs.erp.auth.dto.UpdateUserAdminDTO;
import com.niclabs.erp.auth.dto.UserResponseDTO;
import com.niclabs.erp.auth.dto.ChangePasswordDTO;
import com.niclabs.erp.auth.repository.RoleRepository;
import com.niclabs.erp.auth.repository.UserRepository;
import com.niclabs.erp.exception.BusinessException;
import com.niclabs.erp.exception.DuplicateResourceException;
import com.niclabs.erp.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.niclabs.erp.auth.domain.PasswordResetToken;
import com.niclabs.erp.auth.repository.PasswordResetTokenRepository;
import com.niclabs.erp.notification.service.IEmailService;
import com.niclabs.erp.notification.service.EmailService;
import java.time.LocalDateTime;

import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.HashSet;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Manages user accounts: registration, role assignment, password lifecycle, and profile updates.
 *
 * <p>Write operations are wrapped in {@code @Transactional}. Read operations use
 * {@code readOnly = true} to skip dirty checking and optimise connection pool usage.</p>
 */
@Service
@RequiredArgsConstructor
public class UserService implements IUserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetTokenRepository tokenRepository;
    private final IEmailService emailService;

    /**
     * Registers a new user with the default {@code ROLE_USER} role.
     *
     * @param data registration payload containing name, e-mail, and raw password
     * @return the persisted {@link User} entity
     * @throws DuplicateResourceException if the e-mail is already in use
     */
    @Transactional
    public User registerUser(RegisterDTO data) {
        if (userRepository.findByEmail(data.email()).isPresent()) {
            throw new DuplicateResourceException("E-mail já cadastrado no sistema.");
        }

        User newUser = new User();
        newUser.setId(UUID.randomUUID());
        newUser.setName(data.name());
        newUser.setEmail(data.email());
        newUser.setPassword(passwordEncoder.encode(data.password()));
        newUser.setActive(true);

        Role defaultRole = roleRepository.findByName("ROLE_USER")
                .orElseThrow(() -> new ResourceNotFoundException("Cargo ROLE_USER não encontrado no banco."));
        newUser.setRoles(new HashSet<>(List.of(defaultRole)));

        return userRepository.save(newUser);
    }

    // --- NOVOS MÉTODOS DE GESTÃO ---

    /**
     * Returns a paginated list of all registered users.
     *
     * @param pageable pagination and sort parameters
     * @return page of {@link UserResponseDTO}
     */
    @Transactional(readOnly = true)
    public Page<UserResponseDTO> listAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable)
                .map(this::mapToDTO);
    }

    /**
     * Replaces the full set of roles assigned to a user.
     *
     * @param userId    target user identifier
     * @param roleNames new set of role names to assign
     * @return updated {@link UserResponseDTO}
     * @throws ResourceNotFoundException if the user or any role name does not exist
     */
    @Transactional
    public UserResponseDTO updateUserRoles(UUID userId, List<String> roleNames) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

        Set<Role> newRoles = new HashSet<>();
        for (String roleName : roleNames) {
            Role role = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new ResourceNotFoundException("Cargo '" + roleName + "' não encontrado."));
            newRoles.add(role);
        }

        user.setRoles(newRoles);
        userRepository.save(user);

        return mapToDTO(user);
    }

    // Método auxiliar para converter User -> UserResponseDTO
    private UserResponseDTO mapToDTO(User user) {
        // Extrai apenas os nomes das roles (String) da lista de objetos Role
        List<String> roleNames = user.getRoles() != null
                ? user.getRoles().stream().map(Role::getName).collect(Collectors.toList())
                : List.of();

        // Passando o avatarUrl como o 4º parâmetro!
        return new UserResponseDTO(user.getId(), user.getName(), user.getEmail(), user.getAvatarUrl(), roleNames);
    }

    /**
     * Generates a password-reset token and dispatches a reset e-mail to the user.
     *
     * @param email the user's registered e-mail address
     * @throws ResourceNotFoundException if no user is found with the given e-mail
     */
    @Transactional
    public void requestPasswordReset(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

        // A07: Use SecureRandom instead of UUID for password reset tokens (32 bytes = 64 hex chars)
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        String token = HexFormat.of().formatHex(bytes);

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUserId(user.getId());
        resetToken.setExpiryDate(LocalDateTime.now().plusHours(2));

        tokenRepository.save(resetToken);
        emailService.sendPasswordResetEmail(user.getEmail(), token);
    }

    /**
     * Validates a password-reset token and sets the user's new password.
     *
     * @param token       the reset token received by e-mail
     * @param newPassword the desired new password in plain text (will be encoded)
     * @throws ResourceNotFoundException if the token is not found
     * @throws BusinessException         if the token has expired
     */
    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Token inválido ou não encontrado."));

        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            tokenRepository.delete(resetToken);
            throw new BusinessException("Este link de recuperação já expirou.");
        }

        User user = userRepository.findById(resetToken.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        tokenRepository.delete(resetToken);
    }

    /**
     * Updates the avatar URL for the user identified by e-mail.
     *
     * @param email     the user's e-mail address
     * @param avatarUrl public URL of the new avatar image
     * @return updated {@link UserResponseDTO}
     * @throws ResourceNotFoundException if no user is found with the given e-mail
     */
    @Transactional
    public UserResponseDTO updateAvatar(String email, String avatarUrl) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

        user.setAvatarUrl(avatarUrl);
        return mapToDTO(userRepository.save(user));
    }

    /**
     * Allows a user to change their own password after verifying the current one.
     *
     * @param email the authenticated user's e-mail
     * @param dto   current password for verification and new desired password
     * @throws BusinessException         if the current password does not match
     * @throws ResourceNotFoundException if no user is found with the given e-mail
     */
    @Transactional
    public void changePassword(String email, ChangePasswordDTO dto) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

        if (!passwordEncoder.matches(dto.currentPassword(), user.getPassword())) {
            throw new BusinessException("A senha atual está incorreta.");
        }

        user.setPassword(passwordEncoder.encode(dto.newPassword()));
        userRepository.save(user);
    }

    /**
     * Allows an administrator to update a user's name and e-mail.
     *
     * @param id  target user identifier
     * @param dto new name and e-mail values
     * @return updated {@link UserResponseDTO}
     * @throws DuplicateResourceException if the new e-mail is already used by another account
     * @throws ResourceNotFoundException  if no user is found with the given id
     */
    @Transactional
    public UserResponseDTO updateUserDetailsByAdmin(UUID id, UpdateUserAdminDTO dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

        if (!user.getEmail().equals(dto.email()) && userRepository.findByEmail(dto.email()).isPresent()) {
            throw new DuplicateResourceException("Este e-mail já está em uso por outro usuário.");
        }

        user.setName(dto.name());
        user.setEmail(dto.email());

        return mapToDTO(userRepository.save(user));
    }

    /**
     * Soft-deactivates a user account so it can no longer authenticate.
     *
     * @param id target user identifier
     * @throws ResourceNotFoundException if no user is found with the given id
     */
    @Transactional
    public void deactivateUser(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
        user.setActive(false);
        userRepository.save(user);
    }

    /**
     * Returns the profile of the currently authenticated user identified by e-mail.
     *
     * @param email e-mail claim from the JWT (Principal name)
     * @return user summary
     * @throws ResourceNotFoundException if no user matches the e-mail
     */
    @Transactional(readOnly = true)
    public UserResponseDTO getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
        return mapToDTO(user);
    }
}
