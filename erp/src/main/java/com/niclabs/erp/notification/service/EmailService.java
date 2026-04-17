package com.niclabs.erp.notification.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * SMTP-based e-mail delivery service.
 *
 * <p>All send operations are {@link Async} so they never block the calling thread.
 * Failures are logged but not re-thrown, ensuring a transient mail server outage
 * does not roll back the business operation that triggered the notification.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService implements IEmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String remetente;

    /**
     * Base URL of the front-end application used to build password-reset links.
     * Defaults to {@code http://localhost:5173} for local development; override
     * with the {@code APP_FRONTEND_URL} environment variable in production.
     */
    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    @Async
    public void sendTicketResolvedEmail(String destinatario, String idChamado, String titulo) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(remetente);
            message.setTo(destinatario);
            message.setSubject("Nic-ERP | Chamado Resolvido: " + titulo);

            String texto = String.format(
                    "Olá!\n\nO seu chamado #%s (%s) foi marcado como RESOLVIDO pela nossa equipe de TI.\n\n" +
                            "Caso o problema persista ou você tenha novas dúvidas, por favor, abra um novo chamado no sistema.\n\n" +
                            "Atenciosamente,\nEquipe de Infraestrutura - Nic-Labs",
                    idChamado, titulo
            );

            message.setText(texto);
            mailSender.send(message);

            log.info("E-mail de resolução enviado com sucesso para: {}", destinatario);

        } catch (Exception e) {
            log.error("Erro ao enviar e-mail de resolução: {}", e.getMessage(), e);
        }
    }

    @Override
    @Async
    public void sendMassAnnouncementEmail(java.util.List<String> bccEmails, String titulo, String conteudo) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(remetente);
            message.setBcc(bccEmails.toArray(new String[0]));
            message.setSubject("Nic-ERP | Novo Aviso no Mural: " + titulo);

            String texto = String.format(
                    "Olá equipe!\n\nUm novo aviso foi publicado no mural do ERP:\n\n" +
                            "📌 %s\n\n%s\n\n" +
                            "Acesse o sistema para mais detalhes.\n\nAtenciosamente,\nNic-Labs",
                    titulo, conteudo
            );

            message.setText(texto);
            mailSender.send(message);

            log.info("Aviso em massa disparado com sucesso para {} colaboradores.", bccEmails.size());

        } catch (Exception e) {
            log.error("Erro ao enviar aviso em massa: {}", e.getMessage(), e);
        }
    }

    @Override
    @Async
    public void sendPasswordResetEmail(String destinatario, String token) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(remetente);
            message.setTo(destinatario);
            message.setSubject("Nic-ERP | Recuperação de Senha");

            String resetUrl = frontendUrl + "/reset-password?token=" + token;

            String texto = "Olá!\n\nVocê solicitou a recuperação da sua senha.\n\n" +
                    "Clique no link abaixo para criar uma nova senha:\n" +
                    resetUrl + "\n\n" +
                    "Este link expira em 2 horas.\nSe você não solicitou a alteração, ignore este e-mail.";

            message.setText(texto);
            mailSender.send(message);

            log.info("E-mail de recuperação enviado com sucesso para: {}", destinatario);

        } catch (Exception e) {
            log.error("Erro ao enviar e-mail de recuperação: {}", e.getMessage(), e);
        }
    }
}