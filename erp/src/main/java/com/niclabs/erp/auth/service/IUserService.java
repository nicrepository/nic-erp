package com.niclabs.erp.auth.service;

import com.niclabs.erp.auth.domain.User;
import com.niclabs.erp.auth.dto.ChangePasswordDTO;
import com.niclabs.erp.auth.dto.FirstLoginPasswordDTO;
import com.niclabs.erp.auth.dto.RegisterDTO;
import com.niclabs.erp.auth.dto.UpdateUserAdminDTO;
import com.niclabs.erp.auth.dto.UserResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

/**
 * Contract for user lifecycle management within the ERP.
 *
 * <p>Covers registration, profile updates, role assignment, password operations,
 * and account deactivation. All implementations must ensure BCrypt password hashing
 * and that password reset tokens expire after a fixed time window.</p>
 */
public interface IUserService {

    /**
     * Registers a new user with a default {@code ROLE_USER} assignment.
     *
     * @param data registration payload containing name, e-mail and raw password
     * @return the persisted {@link User} entity
     * @throws com.niclabs.erp.exception.DuplicateResourceException if the e-mail is already in use
     */
    User registerUser(RegisterDTO data);

    /**
     * Returns a paginated list of all users in the system.
     *
     * @param pageable pagination and sorting parameters
     * @return page of user summaries
     */
    Page<UserResponseDTO> listAllUsers(Pageable pageable);

    /**
     * Replaces the role set of a user entirely.
     *
     * <p>All previously assigned roles are removed and replaced by the provided list.
     * At least one valid role name must be supplied.</p>
     *
     * @param userId    target user identifier
     * @param roleNames list of role names (e.g. {@code "ROLE_ADMIN"})
     * @return updated user summary
     * @throws com.niclabs.erp.exception.ResourceNotFoundException if the user or any role is not found
     */
    UserResponseDTO updateUserRoles(UUID userId, List<String> roleNames);

    /**
     * Initiates a password reset flow by generating a time-limited token and
     * dispatching a reset e-mail. Errors are silenced to prevent user enumeration.
     *
     * @param email e-mail address registered in the system
     */
    void requestPasswordReset(String email);

    /**
     * Completes the password reset using a previously issued token.
     *
     * @param token       the reset token delivered to the user's e-mail
     * @param newPassword the new plain-text password (will be hashed before storage)
     * @throws com.niclabs.erp.exception.ResourceNotFoundException if the token does not exist
     * @throws com.niclabs.erp.exception.BusinessException         if the token has expired
     */
    void resetPassword(String token, String newPassword);

    /**
     * Updates the avatar URL for the authenticated user identified by e-mail.
     *
     * @param email     e-mail identifying the current user
     * @param avatarUrl relative URL of the uploaded avatar file
     * @return updated user summary
     */
    UserResponseDTO updateAvatar(String email, String avatarUrl);

    /**
     * Changes a user's own password after verifying the current credential.
     *
     * @param email e-mail of the authenticated user
     * @param dto   payload containing current and new passwords
     * @throws com.niclabs.erp.exception.BusinessException if the current password does not match
     */
    void changePassword(String email, ChangePasswordDTO dto);

    /**
     * Allows an administrator to update a user's name and e-mail address.
     *
     * @param id  target user identifier
     * @param dto payload with new name and e-mail
     * @return updated user summary
     * @throws com.niclabs.erp.exception.DuplicateResourceException if the new e-mail belongs to another account
     */
    UserResponseDTO updateUserDetailsByAdmin(UUID id, UpdateUserAdminDTO dto);

    /**
     * Returns the profile of the currently authenticated user identified by e-mail.
     *
     * @param email e-mail claim from the JWT (Principal name)
     * @return user summary
     * @throws com.niclabs.erp.exception.ResourceNotFoundException if no user matches the e-mail
     */
    UserResponseDTO getCurrentUser(String email);

    /**
     * Sets a new password for a user performing their first login.
     *
     * <p>Does <em>not</em> verify the current password because the caller's identity
     * is already proved by the JWT attached to the request. Clears the
     * {@code mustChangePassword} flag on success.</p>
     *
     * @param email       e-mail claim from the JWT (Principal name)
     * @param dto         payload containing only the new plain-text password
     * @throws com.niclabs.erp.exception.ResourceNotFoundException if no user matches the e-mail
     * @throws com.niclabs.erp.exception.BusinessException         if the account does not require a first-login change
     */
    void setFirstLoginPassword(String email, FirstLoginPasswordDTO dto);

    /**
     * Soft-deactivates a user account. The record is preserved in the database
     * but the account can no longer be used to authenticate.
     *
     * @param id target user identifier
     * @throws com.niclabs.erp.exception.ResourceNotFoundException if the user does not exist
     */
    void deactivateUser(UUID id);
}
