package com.niclabs.erp.hr.service;

import java.util.UUID;
import com.niclabs.erp.auth.domain.User;
import com.niclabs.erp.auth.repository.UserRepository;
import com.niclabs.erp.hr.domain.Employee;
import com.niclabs.erp.hr.dto.EmployeeRequestDTO;
import com.niclabs.erp.hr.dto.EmployeeResponseDTO;
import com.niclabs.erp.hr.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository; // Injetamos para poder vincular o login da pessoa

    @Transactional
    public EmployeeResponseDTO createEmployee(EmployeeRequestDTO dto) {
        // 1. Regras de Negócio: Bloqueia CPFs e Matrículas duplicadas
        if (employeeRepository.findByCpf(dto.cpf()).isPresent()) {
            throw new RuntimeException("Já existe um colaborador cadastrado com este CPF.");
        }
        if (employeeRepository.findByRegistrationNumber(dto.registrationNumber()).isPresent()) {
            throw new RuntimeException("Esta matrícula corporativa já está em uso.");
        }

        Employee employee = new Employee();

        // 2. Vinculação de Acesso (Opcional): Se o RH mandou um ID de usuário, nós fazemos a ponte
        if (dto.userId() != null) {
            User user = userRepository.findById(dto.userId())
                    .orElseThrow(() -> new RuntimeException("Usuário de acesso não encontrado no sistema."));
            employee.setUser(user);
        }

        // 3. Preenche a Ficha Cadastral
        employee.setFullName(dto.fullName());
        employee.setCpf(dto.cpf());
        employee.setRg(dto.rg());
        employee.setBirthDate(dto.birthDate());
        employee.setPhone(dto.phone());
        employee.setRegistrationNumber(dto.registrationNumber());
        employee.setAdmissionDate(dto.admissionDate());
        employee.setJobTitle(dto.jobTitle());
        employee.setDepartment(dto.department());
        employee.setBaseSalary(dto.baseSalary());
        employee.setStatus(dto.status() != null ? dto.status() : "ATIVO");

        // 4. Salva no banco e devolve mapeado para o Front-end
        return mapToDTO(employeeRepository.save(employee));
    }

    @Transactional
    public EmployeeResponseDTO updateEmployee(UUID id, EmployeeRequestDTO dto) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Colaborador não encontrado."));

        // Regra de Negócio: Verifica se alterou o CPF e se o novo CPF já existe em OUTRA ficha
        if (!employee.getCpf().equals(dto.cpf()) && employeeRepository.findByCpf(dto.cpf()).isPresent()) {
            throw new RuntimeException("Já existe outro colaborador cadastrado com este CPF.");
        }

        // Regra de Negócio: Verifica se alterou a Matrícula e se ela já existe em OUTRA ficha
        if (!employee.getRegistrationNumber().equals(dto.registrationNumber()) && employeeRepository.findByRegistrationNumber(dto.registrationNumber()).isPresent()) {
            throw new RuntimeException("Esta matrícula corporativa já está em uso por outro colaborador.");
        }

        // Atualiza o Vínculo de Acesso
        if (dto.userId() != null) {
            User user = userRepository.findById(dto.userId())
                    .orElseThrow(() -> new RuntimeException("Usuário de acesso não encontrado."));
            employee.setUser(user);
        } else {
            employee.setUser(null); // Remove o acesso se o RH desvincular
        }

        // Atualiza os dados da Ficha
        employee.setFullName(dto.fullName());
        employee.setCpf(dto.cpf());
        employee.setRg(dto.rg());
        employee.setBirthDate(dto.birthDate());
        employee.setPhone(dto.phone());
        employee.setRegistrationNumber(dto.registrationNumber());
        employee.setAdmissionDate(dto.admissionDate());
        employee.setJobTitle(dto.jobTitle());
        employee.setDepartment(dto.department());
        employee.setBaseSalary(dto.baseSalary());
        employee.setStatus(dto.status() != null ? dto.status() : "ATIVO");

        return mapToDTO(employeeRepository.save(employee));
    }

    public List<EmployeeResponseDTO> listAllEmployees() {
        return employeeRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // Função utilitária (tradutor): Pega a Entidade pesada do Banco e transforma no DTO leve do React
    private EmployeeResponseDTO mapToDTO(Employee employee) {
        return new EmployeeResponseDTO(
                employee.getId(),
                employee.getUser() != null ? employee.getUser().getId() : null,
                employee.getUser() != null ? employee.getUser().getEmail() : null, // Puxa o e-mail lá da tabela Auth
                employee.getFullName(),
                employee.getCpf(),
                employee.getRg(),
                employee.getBirthDate(),
                employee.getPhone(),
                employee.getRegistrationNumber(),
                employee.getAdmissionDate(),
                employee.getJobTitle(),
                employee.getDepartment(),
                employee.getBaseSalary(),
                employee.getStatus()
        );
    }
}