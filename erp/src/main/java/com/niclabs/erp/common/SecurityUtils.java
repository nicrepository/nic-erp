package com.niclabs.erp.common;

import com.niclabs.erp.auth.domain.User;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

    private SecurityUtils() {}

    /**
     * Returns the authenticated User from the current security context.
     * Must only be called within a request scope where a valid JWT is present.
     */
    public static User getCurrentUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}
