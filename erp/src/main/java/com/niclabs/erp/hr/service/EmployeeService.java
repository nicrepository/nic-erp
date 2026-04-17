package com.niclabs.erp.hr.service;

import java.util.UUID;
import com.niclabs.erp.auth.domain.User;
import com.niclabs.erp.auth.repository.UserRepository;
import com.niclabs.erp.exception.BusinessException;
import com.niclabs.erp.exception.DuplicateResourceException;
import com.niclabs.erp.exception.ResourceNotFoundException;
import com.niclabs.erp.hr.domain.Employee;
import com.niclabs.erp.hr.domain.EmployeeStatus;
import com.niclabs.erp.hr.dto.EmployeeRequestDTO;
import com.niclabs.erp.hr.dto.EmployeeResponseDTO;
import com.niclabs.erp.hr.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Manages the employee lifecycle: hiring, profile updates, terminations, and directory queries.
 *
 * <p>Write operations are wrapped in {@code @Transactional}. Read operations use
 * {@code readOnly = true} to skip dirty checking and optimise connection pool usage.</p>
 */
@Service
@RequiredArgsConstructor
public class EmployeeService implements IEmployeeService {

    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository; // Injetamos para poder vincular o login da pessoa

    /**
     * Hires a new employee, optionally linking an existing system user account.
     *
     * @param dto employee data including CPF, registration number, and job details
     * @return the created {@link EmployeeResponseDTO}
     * @throws DuplicateResourceException if the CPF or registration number is already taken
     */
    @Transactional
    public EmployeeResponseDTO createEmployee(EmployeeRequestDTO dto) {
        if (employeeRepository.findByCpf(dto.cpf()).isPresent()) {
            throw new DuplicateResourceException("Já existe um colaborador cadastrado com este CPF.");
        }
        if (employeeRepository.findByRegistrationNumber(dto.registrationNumber()).isPresent()) {
            throw new DuplicateResourceException("Esta matrícula corporativa já está em uso.");
        }

        Employee employee = new Employee();

        if (dto.userId() != null) {
            User user = userRepository.findById(dto.userId())
                    .orElseThrow(() -> new ResourceNotFoundException("Usuário de acesso não encontrado no sistema."));
            employee.setUser(user);
        }

        applyDtoToEmployee(employee, dto);

        return mapToDTO(employeeRepository.save(employee));
    }

    /**
     * Updates the profile data of an existing employee.
     *
     * @param id  employee identifier
     * @param dto updated employee data
     * @return updated {@link EmployeeResponseDTO}
     * @throws DuplicateResourceException if the new CPF or registration number belongs to another employee
     * @throws ResourceNotFoundException  if the employee does not exist
     */
    @Transactional
    public EmployeeResponseDTO updateEmployee(UUID id, EmployeeRequestDTO dto) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Colaborador não encontrado."));

        if (!employee.getCpf().equals(dto.cpf()) && employeeRepository.findByCpf(dto.cpf()).isPresent()) {
            throw new DuplicateResourceException("Já existe outro colaborador cadastrado com este CPF.");
        }

        if (!employee.getRegistrationNumber().equals(dto.registrationNumber()) && employeeRepository.findByRegistrationNumber(dto.registrationNumber()).isPresent()) {
            throw new DuplicateResourceException("Esta matrícula corporativa já está em uso por outro colaborador.");
        }

        if (dto.userId() != null) {
            User user = userRepository.findById(dto.userId())
                    .orElseThrow(() -> new ResourceNotFoundException("Usuário de acesso não encontrado."));
            employee.setUser(user);
        } else {
            employee.setUser(null);
        }

        applyDtoToEmployee(employee, dto);

        return mapToDTO(employeeRepository.save(employee));
    }

    /**
     * Permanently removes an employee record from the system.
     *
     * @param id employee identifier
     * @throws ResourceNotFoundException if no employee exists with the given id
     */
    @Transactional
    public void deleteEmployee(UUID id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Colaborador não encontrado."));
        employeeRepository.delete(employee);
    }

    /**
     * Returns a paginated list of all employees ordered by full name.
     *
     * @param pageable pagination and sort parameters
     * @return page of {@link EmployeeResponseDTO}
     */
    @Transactional(readOnly = true)
    public Page<EmployeeResponseDTO> listAllEmployees(Pageable pageable) {
        return employeeRepository.findAll(pageable)
                .map(this::mapToDTO);
    }

    private void applyTerminationRule(Employee employee) {
        if (employee.getStatus() != EmployeeStatus.DESLIGADO) {
            employee.setTerminationDate(null);
        }
    }

    /**
     * Maps all mutable DTO fields onto the given employee entity and enforces
     * the termination date rule. Extracted to eliminate duplication between
     * create and update flows.
     */
    private void applyDtoToEmployee(Employee employee, EmployeeRequestDTO dto) {
        employee.setFullName(dto.fullName());
        employee.setCpf(dto.cpf());
        employee.setRg(dto.rg());
        employee.setBirthDate(dto.birthDate());
        employee.setPhone(dto.phone());
        employee.setRegistrationNumber(dto.registrationNumber());
        employee.setAdmissionDate(dto.admissionDate());
        employee.setTerminationDate(dto.terminationDate());
        employee.setJobTitle(dto.jobTitle());
        employee.setDepartment(dto.department());
        employee.setBaseSalary(dto.baseSalary());
        employee.setStatus(dto.status() != null ? dto.status() : EmployeeStatus.ATIVO);
        applyTerminationRule(employee);
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
                employee.getTerminationDate(),
                employee.getJobTitle(),
                employee.getDepartment(),
                employee.getBaseSalary(),
                employee.getStatus()
        );
    }
}