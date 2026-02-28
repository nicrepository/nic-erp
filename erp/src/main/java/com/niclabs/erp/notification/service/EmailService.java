package com.niclabs.erp.notification.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    // Pega o e-mail que você configurou no application.properties
    @Value("${spring.mail.username}")
    private String remetente;

    @Async
    public void sendTicketResolvedEmail(String destinatario, String idChamado, String titulo) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(remetente);
            message.setTo(destinatario);
            message.setSubject("Nic-ERP | Chamado Resolvido: " + titulo);

            // Corpo do e-mail
            String texto = String.format(
                    "Olá!\n\nO seu chamado #%s (%s) foi marcado como RESOLVIDO pela nossa equipe de TI.\n\n" +
                            "Caso o problema persista ou você tenha novas dúvidas, por favor, abra um novo chamado no sistema.\n\n" +
                            "Atenciosamente,\nEquipe de Infraestrutura - Nic-Labs",
                    idChamado, titulo
            );

            message.setText(texto);

            // Dispara para o servidor do Google
            mailSender.send(message);

            System.out.println("✅ E-mail de resolução enviado com sucesso para: " + destinatario);

        } catch (Exception e) {
            System.err.println("❌ Erro ao enviar e-mail em segundo plano: " + e.getMessage());
        }
    }
}