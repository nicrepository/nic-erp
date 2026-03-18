package com.niclabs.erp.hr.service;

import com.niclabs.erp.hr.domain.Absence;
import com.niclabs.erp.hr.domain.Employee;
import com.niclabs.erp.hr.repository.AbsenceRepository;
import com.niclabs.erp.hr.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EmployeeStatusSyncJob {

    private final EmployeeRepository employeeRepository;
    private final AbsenceRepository absenceRepository;

    // Temporário para testes: Roda a cada 1 minuto (60000 ms)
    @Scheduled(cron = "0 1 0 * * *")
    //@Scheduled(fixedRate = 60000)
    @Transactional
    public void syncDailyStatuses() {
        LocalDate today = LocalDate.now();

        // Pega todo mundo que trabalha na empresa (ignora os desligados)
        List<Employee> activeEmployees = employeeRepository.findAll().stream()
                .filter(e -> !"DESLIGADO".equals(e.getStatus()))
                .toList();

        for (Employee emp : activeEmployees) {
            // Verifica se tem ausência para este funcionário HOJE
            List<Absence> currentAbsences = absenceRepository.findActiveAbsencesByEmployee(emp.getId(), today);

            if (!currentAbsences.isEmpty()) {
                Absence currentAbsence = currentAbsences.get(0);
                // Se for férias, o status é FERIAS, qualquer outra coisa (Atestado, Day Off, Licença) é AFASTADO
                String newStatus = currentAbsence.getType();

                if (!newStatus.equals(emp.getStatus())) {
                    emp.setStatus(newStatus);
                    employeeRepository.save(emp);
                }
            } else {
                // Se ele NÃO tem ausência hoje, mas estava como Férias/Afastado ontem... Ele voltou!
                if ("FERIAS".equals(emp.getStatus()) || "AFASTADO".equals(emp.getStatus())) {
                    emp.setStatus("ATIVO");
                    employeeRepository.save(emp);
                }
            }
        }
        System.out.println("Robô da Madrugada: Status dos colaboradores atualizados! " + today);
    }
}
