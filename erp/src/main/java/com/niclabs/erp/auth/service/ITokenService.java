package com.niclabs.erp.auth.service;

import com.niclabs.erp.auth.domain.User;

/**
 * Contract for JWT generation and validation.
 *
 * <p>Tokens embed the user's e-mail (subject), display name, avatar URL, and the
 * full authority list (roles + permissions) required by the front-end for client-side
 * authorization decisions.</p>
 */
public interface ITokenService {

    /**
     * Generates a signed JWT for the given authenticated user.
     *
     * @param user the authenticated user whose claims will be embedded in the token
     * @return a signed JWT string
     * @throws RuntimeException if token generation fails due to a signing algorithm error
     */
    String generateToken(User user);

    /**
     * Validates a JWT and returns its subject (the user's e-mail).
     *
     * @param token the JWT string to validate
     * @return the e-mail embedded in the token, or an empty string if the token is invalid or expired
     */
    String validateToken(String token);
}
