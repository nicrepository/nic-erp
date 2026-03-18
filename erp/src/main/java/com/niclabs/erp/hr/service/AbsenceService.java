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

        // 3. Monta e salva a ausência
        Absence absence = new Absence();
        absence.setEmployee(employee);
        absence.setType(dto.type());
        absence.setStartDate(dto.startDate());
        absence.setEndDate(dto.endDate());
        absence.setDescription(dto.description());
        absence.setStatus(dto.status() != null ? dto.status() : "AGENDADO");

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
}
