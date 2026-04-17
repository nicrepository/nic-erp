package com.niclabs.erp.hr.service;

import com.niclabs.erp.auth.domain.User;
import com.niclabs.erp.auth.repository.UserRepository;
import com.niclabs.erp.hr.domain.Absence;
import com.niclabs.erp.hr.repository.AbsenceRepository;
import com.niclabs.erp.notification.domain.Notification;
import com.niclabs.erp.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AbsenceNotifierJob {

    private final AbsenceRepository absenceRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    // Envia notificação toda segunda a sexta às 8h e 15h com o resumo das ausências do dia e quem retorna amanhã
    @Scheduled(cron = "0 0 8,15 * * MON-FRI")
    @Transactional
    public void generateDailyAbsenceReport() {
        LocalDate today = LocalDate.now();
        LocalDate thirtyDaysFromNow = today.plusDays(30); // Calcula a janela de 30 dias

        // 1. Busca os dados no banco
        List<Absence> absentToday = absenceRepository.findAbsencesToday(today);
        List<Absence> returningTomorrow = absenceRepository.findReturningTomorrow(today);
        List<Absence> upcomingAbsences = absenceRepository.findUpcomingAbsences(today, thirtyDaysFromNow);

        // Se não tiver nada acontecendo e nada programado, o robô não manda notificação vazia
        if (absentToday.isEmpty() && returningTomorrow.isEmpty() && upcomingAbsences.isEmpty()) {
            return;
        }

        // 2. Monta o "Card" do Relatório
        StringBuilder report = new StringBuilder();
        report.append("Resumo do time para hoje:\n\n");

        if (!absentToday.isEmpty()) {
            report.append("🏖️ Ausentes Hoje:\n");
            for (Absence a : absentToday) {
                report.append("- ").append(a.getEmployee().getFullName())
                        .append(" (").append(a.getType()).append(") | Retorna em: ")
                        .append(a.getEndDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))).append("\n");
            }
            report.append("\n");
        }

        if (!returningTomorrow.isEmpty()) {
            report.append("🔜 De volta amanhã:\n");
            for (Absence a : returningTomorrow) {
                report.append("- ").append(a.getEmployee().getFullName()).append("\n");
            }
            report.append("\n");
        }

        // --- NOVO BLOCO: PRÓXIMAS AUSÊNCIAS ---
        if (!upcomingAbsences.isEmpty()) {
            report.append("📅 Próximas Ausências (Próximos 30 dias):\n");
            for (Absence a : upcomingAbsences) {
                report.append("- ").append(a.getEmployee().getFullName())
                        .append(" (").append(a.getType()).append(") | Início: ")
                        .append(a.getStartDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))).append("\n");
            }
        }

        // 3. Descobre QUEM deve receber a notificação
        List<User> targetUsers = userRepository.findAll().stream()
                .filter(u -> u.getRoles().stream().anyMatch(role ->
                        role.getName().equals("ROLE_ADMIN") ||
                                role.getPermissions().stream().anyMatch(p -> p.getName().equals("ACCESS_HR"))
                ))
                .toList();

        // 4. Dispara a notificação para cada um deles
        for (User user : targetUsers) {
            Notification notification = new Notification();
            notification.setUser(user);
            notification.setTitle("Relatório Diário de Ausências");
            notification.setMessage(report.toString().trim()); // .trim() remove espaços vazios no final
            notificationRepository.save(notification);
        }

        log.info("Relatório de ausências gerado e enviado para {} gestores.", targetUsers.size());
    }
}