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

    @Async
    public void sendMassAnnouncementEmail(java.util.List<String> bccEmails, String titulo, String conteudo) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(remetente);

            // O segredo do envio em massa: transforma a lista do Java num Array e joga no BCC (Cópia Oculta)
            message.setBcc(bccEmails.toArray(new String[0]));

            message.setSubject("Nic-ERP | Novo Aviso no Mural: " + titulo);

            // Monta o corpo da mensagem
            String texto = String.format(
                    "Olá equipe!\n\nUm novo aviso foi publicado no mural do ERP:\n\n" +
                            "📌 %s\n\n%s\n\n" +
                            "Acesse o sistema para mais detalhes.\n\nAtenciosamente,\nNic-Labs",
                    titulo, conteudo
            );

            message.setText(texto);

            // Dispara uma única vez para o servidor do Google, e ele se vira para entregar para os 100 funcionários
            mailSender.send(message);

            System.out.println("✅ Aviso em massa disparado com sucesso para " + bccEmails.size() + " colaboradores.");

        } catch (Exception e) {
            System.err.println("❌ Erro ao enviar aviso em massa: " + e.getMessage());
        }
    }

    @Async
    public void sendPasswordResetEmail(String destinatario, String token) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(remetente);
            message.setTo(destinatario);
            message.setSubject("Nic-ERP | Recuperação de Senha");

            // Dica de Arquitetura: No futuro, esse link apontará para a tela do seu front-end em React (ex: localhost:3000)
            // Por enquanto, vamos apontar para a própria API apenas para visualizarmos o token
            String resetUrl = "http://localhost:8080/auth/reset-password?token=" + token;

            String texto = "Olá!\n\nVocê solicitou a recuperação da sua senha.\n\n" +
                    "Clique no link abaixo para criar uma nova senha:\n" +
                    resetUrl + "\n\n" +
                    "Este link expira em 2 horas.\nSe você não solicitou a alteração, ignore este e-mail.";

            message.setText(texto);

            mailSender.send(message);

            System.out.println("✅ E-mail de recuperação enviado com sucesso para: " + destinatario);

        } catch (Exception e) {
            System.err.println("❌ Erro ao enviar e-mail de recuperação: " + e.getMessage());
        }
    }
}