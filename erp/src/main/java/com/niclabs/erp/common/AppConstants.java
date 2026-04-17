package com.niclabs.erp.common;

/**
 * Centralises application-wide string and numeric constants.
 *
 * <p>Using named constants instead of scattered literals eliminates typo-prone
 * magic values and provides a single place to update them — satisfying the
 * Don't Repeat Yourself (DRY) principle.</p>
 */
public final class AppConstants {

    // ── JWT ─────────────────────────────────────────────────────────────────

    /** Issuer claim embedded in every JWT. Must match on generation and validation. */
    public static final String TOKEN_ISSUER = "nic-erp";

    /** Duration in hours before an access token expires. */
    public static final int TOKEN_EXPIRY_HOURS = 2;

    /** UTC offset used for token expiry calculations. */
    public static final String TIMEZONE_OFFSET = "-03:00";

    // ── Roles ────────────────────────────────────────────────────────────────

    /** System role granted to super-administrators. Carries all permissions. */
    public static final String ROLE_ADMIN = "ROLE_ADMIN";

    /** Default role assigned to every newly registered user. */
    public static final String ROLE_USER = "ROLE_USER";

    // ── Storage ──────────────────────────────────────────────────────────────

    /** URL prefix prepended to stored filenames to build a publicly accessible URL. */
    public static final String FILE_URL_PREFIX = "/files/";

    // ── Permissions ──────────────────────────────────────────────────────────

    public static final String PERM_ACCESS_HR = "ACCESS_HR";
    public static final String PERM_ACCESS_USERS = "ACCESS_USERS";
    public static final String PERM_ACCESS_HELPDESK = "ACCESS_HELPDESK";
    public static final String PERM_ACCESS_DASHBOARD = "ACCESS_DASHBOARD";
    public static final String PERM_ACCESS_INVENTORY_ADMIN = "ACCESS_INVENTORY_ADMIN";
    public static final String PERM_ACCESS_INVENTORY_IT = "ACCESS_INVENTORY_IT";
    public static final String PERM_ACCESS_ANNOUNCEMENTS_MANAGE = "ACCESS_ANNOUNCEMENTS_MANAGE";

    private AppConstants() {
        // Utility class — do not instantiate
    }
}
