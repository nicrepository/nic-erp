package com.niclabs.erp.hr.service;

import com.niclabs.erp.hr.domain.Absence;
import com.niclabs.erp.hr.domain.Employee;
import com.niclabs.erp.hr.dto.AbsenceRequestDTO;
import com.niclabs.erp.hr.dto.AbsenceResponseDTO;
import com.niclabs.erp.hr.repository.AbsenceRepository;
import com.niclabs.erp.hr.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AbsenceService {

    private final AbsenceRepository absenceRepository;
    private final EmployeeRepository employeeRepository;

    @Transactional
    public AbsenceResponseDTO createAbsence(AbsenceRequestDTO dto) {
        // 1. Validação de Negócio: Data de fim não pode ser antes do início
        if (dto.endDate().isBefore(dto.startDate())) {
            throw new RuntimeException("A data de término não pode ser anterior à data de início.");
        }

        // 2. Verifica se o funcionário existe
        Employee employee = employeeRepository.findById(dto.employeeId())
                .orElseThrow(() -> new RuntimeException("Colaborador não encontrado no sistema."));

        // 3. Monta a ausência
        Absence absence = new Absence();
        absence.setEmployee(employee);
        absence.setType(dto.type());
        absence.setStartDate(dto.startDate());
        absence.setEndDate(dto.endDate());
        absence.setDescription(dto.description());
        absence.setStatus(dto.status() != null ? dto.status() : "AGENDADO");

        // --- ATUALIZAÇÃO IMEDIATA DE STATUS (Antes de sair do método!) ---
        LocalDate today = LocalDate.now();

        // Se a ausência que acabamos de lançar começa hoje (ou no passado) e ainda não terminou
        if (!absence.getStartDate().isAfter(today) && !absence.getEndDate().isBefore(today)) {
            Employee emp = absence.getEmployee();
            String newStatus = absence.getType();

            if (!newStatus.equals(emp.getStatus())) {
                emp.setStatus(newStatus);
                employeeRepository.save(emp); // Salva o novo status na ficha dele
            }
        }

        // 4. Salva a ausência no banco de dados e retorna o DTO para o Front-end
        return mapToDTO(absenceRepository.save(absence));
    }

    // Busca o histórico de um colaborador específico (excelente para a tela de Perfil dele)
    public List<AbsenceResponseDTO> getAbsencesByEmployee(UUID employeeId) {
        return absenceRepository.findByEmployeeIdOrderByStartDateDesc(employeeId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // Busca todas as ausências (para a visão geral do RH)
    public List<AbsenceResponseDTO> getAllAbsences() {
        return absenceRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // Tradutor: Entidade -> DTO (trazendo o nome do funcionário junto)
    private AbsenceResponseDTO mapToDTO(Absence absence) {
        return new AbsenceResponseDTO(
                absence.getId(),
                absence.getEmployee().getId(),
                absence.getEmployee().getFullName(),
                absence.getType(),
                absence.getStartDate(),
                absence.getEndDate(),
                absence.getDescription(),
                absence.getStatus()
        );
    }

    @Transactional
    public AbsenceResponseDTO updateAbsence(UUID id, AbsenceRequestDTO dto) {
        Absence absence = absenceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ausência não encontrada."));

        if (dto.endDate().isBefore(dto.startDate())) {
            throw new RuntimeException("A data de término não pode ser anterior à data de início.");
        }

        absence.setType(dto.type());
        absence.setStartDate(dto.startDate());
        absence.setEndDate(dto.endDate());
        absence.setDescription(dto.description());

        Absence updatedAbsence = absenceRepository.save(absence);
        recalculateEmployeeStatus(updatedAbsence.getEmployee()); // Atualiza o status caso a data tenha mudado

        return mapToDTO(updatedAbsence);
    }

    @Transactional
    public void deleteAbsence(UUID id) {
        Absence absence = absenceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ausência não encontrada."));

        Employee emp = absence.getEmployee();
        absenceRepository.delete(absence);

        // Garante que o banco delete a ausência antes de recalcularmos o status
        absenceRepository.flush();
        recalculateEmployeeStatus(emp);
    }

    // --- Helper: Recalcula o status do funcionário na hora ---
    private void recalculateEmployeeStatus(Employee emp) {
        if ("DESLIGADO".equals(emp.getStatus())) return; // Não mexe em quem foi demitido

        LocalDate today = LocalDate.now();
        List<Absence> currentAbsences = absenceRepository.findActiveAbsencesByEmployee(emp.getId(), today);

        if (!currentAbsences.isEmpty()) {
            emp.setStatus(currentAbsences.get(0).getType()); // Coloca o tipo da folga atual
        } else {
            emp.setStatus("ATIVO"); // Se não tem folga hoje, está ativo
        }
        employeeRepository.save(emp);
    }
}
