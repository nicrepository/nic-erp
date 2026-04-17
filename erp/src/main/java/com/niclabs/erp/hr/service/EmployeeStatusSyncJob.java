package com.niclabs.erp.hr.service;

import com.niclabs.erp.hr.domain.Absence;
import com.niclabs.erp.hr.domain.Employee;
import com.niclabs.erp.hr.domain.EmployeeStatus;
import com.niclabs.erp.hr.repository.AbsenceRepository;
import com.niclabs.erp.hr.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmployeeStatusSyncJob {

    private final EmployeeRepository employeeRepository;
    private final AbsenceRepository absenceRepository;

    @Scheduled(cron = "0 1 0 * * *")
    @Transactional
    public void syncDailyStatuses() {
        LocalDate today = LocalDate.now();

        List<Employee> activeEmployees = employeeRepository.findAll().stream()
                .filter(e -> e.getStatus() != EmployeeStatus.DESLIGADO)
                .toList();

        for (Employee emp : activeEmployees) {
            List<Absence> currentAbsences = absenceRepository.findActiveAbsencesByEmployee(emp.getId(), today);

            if (!currentAbsences.isEmpty()) {
                EmployeeStatus newStatus = currentAbsences.get(0).getType().toEmployeeStatus();
                if (newStatus != emp.getStatus()) {
                    emp.setStatus(newStatus);
                    employeeRepository.save(emp);
                }
            } else {
                if (emp.getStatus() == EmployeeStatus.FERIAS || emp.getStatus() == EmployeeStatus.AFASTADO) {
                    emp.setStatus(EmployeeStatus.ATIVO);
                    employeeRepository.save(emp);
                }
            }
        }
        log.info("Status dos colaboradores sincronizados em {}.", today);
    }
}

