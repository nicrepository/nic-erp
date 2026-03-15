package com.niclabs.erp.hr.repository;

import com.niclabs.erp.hr.domain.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, UUID> {

    // Busca customizada para validação de duplicidade
    Optional<Employee> findByCpf(String cpf);

    // Busca customizada para encontrar pela matrícula corporativa
    Optional<Employee> findByRegistrationNumber(String registrationNumber);
}