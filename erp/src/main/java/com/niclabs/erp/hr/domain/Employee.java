package com.niclabs.erp.hr.domain;

import com.niclabs.erp.auth.domain.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Table(name = "employees", schema = "hr")
@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SQLDelete(sql = "UPDATE hr.employees SET deleted_at = NOW() WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Relacionamento 1 para 1 com o Usuário de acesso
    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    // Dados Pessoais
    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(unique = true, nullable = false, length = 14)
    private String cpf;

    @Column(length = 20)
    private String rg;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(length = 20)
    private String phone;

    // Dados Corporativos
    @Column(name = "registration_number", unique = true, nullable = false, length = 50)
    private String registrationNumber;

    @Column(name = "admission_date", nullable = false)
    private LocalDate admissionDate;

    @Column(name = "termination_date")
    private LocalDate terminationDate;

    @Column(name = "job_title", nullable = false, length = 100)
    private String jobTitle;

    @Column(nullable = false, length = 100)
    private String department;

    @Column(name = "base_salary", precision = 10, scale = 2)
    private BigDecimal baseSalary;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private EmployeeStatus status = EmployeeStatus.ATIVO;

    // Auditoria
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
