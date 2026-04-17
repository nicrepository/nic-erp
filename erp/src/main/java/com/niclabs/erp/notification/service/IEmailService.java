package com.niclabs.erp.notification.service;

import java.util.List;

/**
 * Contract for outbound e-mail notifications.
 *
 * <p>All methods are fire-and-forget (asynchronous). Errors are logged but never
 * propagated to the caller to avoid blocking the main business flow.</p>
 */
public interface IEmailService {

    /**
     * Notifies the ticket requester that their support ticket has been resolved.
     *
     * @param recipient     requester's e-mail address
     * @param ticketShortId abbreviated ticket ID shown in the e-mail subject
     * @param ticketTitle   ticket title shown in the e-mail subject
     */
    void sendTicketResolvedEmail(String recipient, String ticketShortId, String ticketTitle);

    /**
     * Sends a mass announcement to all users via BCC to protect recipient privacy.
     *
     * @param bccEmails list of recipient e-mail addresses (sent as BCC)
     * @param title     announcement title
     * @param content   announcement body text
     */
    void sendMassAnnouncementEmail(List<String> bccEmails, String title, String content);

    /**
     * Dispatches a password reset link containing a time-limited token.
     *
     * @param recipient e-mail address of the user requesting the reset
     * @param token     the generated reset token to embed in the link
     */
    void sendPasswordResetEmail(String recipient, String token);
}
