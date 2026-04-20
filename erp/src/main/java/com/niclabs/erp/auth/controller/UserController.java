package com.niclabs.erp.auth.controller;

import com.niclabs.erp.auth.dto.UpdateUserAdminDTO;
import com.niclabs.erp.auth.dto.UserResponseDTO;
import com.niclabs.erp.auth.dto.ChangePasswordDTO;
import com.niclabs.erp.auth.service.IUserService;
import com.niclabs.erp.common.AppConstants;
import com.niclabs.erp.storage.service.IStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.validation.Valid;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

/**
 * REST controller for user management, profile settings, and password changes.
 *
 * <p>Provides administrative operations (list, role assignment, deactivation) as well as
 * self-service operations (avatar upload, password change) for the authenticated user.</p>
 */
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Tag(name = "Usuários", description = "Gestão de usuários, perfis e senhas")
public class UserController {

    private final IUserService userService;
    private final IStorageService storageService;

    /**
     * Returns the profile of the currently authenticated user.
     * Accessible to any authenticated user — no admin role required.
     *
     * @param principal the currently authenticated user
     * @return 200 OK with the {@link UserResponseDTO} for the caller
     */
    @GetMapping("/me")
    public ResponseEntity<UserResponseDTO> getMe(Principal principal) {
        return ResponseEntity.ok(userService.getCurrentUser(principal.getName()));
    }

    /**
     * Retrieves a paginated list of all registered users.
     *
     * @param pageable pagination and sort parameters (default: page 0, size 20, sorted by name)
     * @return 200 OK with a page of {@link UserResponseDTO}
     */
    @GetMapping
    @PreAuthorize("hasAuthority('ACCESS_USERS') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_TI') or hasAuthority('ROLE_RH')")
    public ResponseEntity<Page<UserResponseDTO>> getAllUsers(@PageableDefault(size = 20, sort = "name") Pageable pageable) {
        return ResponseEntity.ok(userService.listAllUsers(pageable));
    }

    /**
     * Replaces the entire role set of a user with the supplied list.
     *
     * @param id        target user identifier
     * @param roleNames list of role names to assign (e.g. {@code "ROLE_ADMIN"})
     * @return 200 OK with the updated {@link UserResponseDTO}
     */
    @PutMapping("/{id}/roles")
    @PreAuthorize("hasAuthority('ACCESS_USERS') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<UserResponseDTO> updateRoles(
            @PathVariable UUID id,
            @RequestBody List<String> roleNames) {
        return ResponseEntity.ok(userService.updateUserRoles(id, roleNames));
    }

    /**
     * Uploads an avatar image and sets it as the profile picture for the authenticated user.
     *
     * @param file      the image file to upload (multipart/form-data)
     * @param principal the currently authenticated user
     * @return 200 OK with the updated {@link UserResponseDTO} including the new avatar URL
     */
    // --- NOVA ROTA DE UPLOAD DE AVATAR ---
    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserResponseDTO> uploadAvatar(
            @RequestParam("file") MultipartFile file,
            Principal principal) {

        String fileName = storageService.store(file);
        String fileUrl = AppConstants.FILE_URL_PREFIX + fileName;
        UserResponseDTO updatedUser = userService.updateAvatar(principal.getName(), fileUrl);
        return ResponseEntity.ok(updatedUser);
    }

    /**
     * Changes the authenticated user's own password after verifying the current credential.
     *
     * @param dto       payload containing the current password and the desired new password
     * @param principal the currently authenticated user
     * @return 200 OK with a confirmation message
     */
    @PutMapping("/me/password")
    public ResponseEntity<String> changePassword(
            @Valid @RequestBody ChangePasswordDTO dto,
            Principal principal) {
        userService.changePassword(principal.getName(), dto);
        return ResponseEntity.ok("Senha alterada com sucesso!");
    }

    /**
     * Soft-deactivates a user account so it can no longer be used to authenticate.
     *
     * @param id target user identifier
     * @return 204 No Content on success
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ACCESS_USERS') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> deactivateUser(@PathVariable UUID id) {
        userService.deactivateUser(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Allows an administrator to update a user's name and e-mail address.
     *
     * @param id  target user identifier
     * @param dto payload with the new name and e-mail
     * @return 200 OK with the updated {@link UserResponseDTO}
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ACCESS_USERS') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<UserResponseDTO> updateUserDetails(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserAdminDTO dto) {
        return ResponseEntity.ok(userService.updateUserDetailsByAdmin(id, dto));
    }
}