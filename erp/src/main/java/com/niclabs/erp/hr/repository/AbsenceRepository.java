package com.niclabs.erp.hr.repository;

import com.niclabs.erp.hr.domain.Absence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface AbsenceRepository extends JpaRepository<Absence, UUID> {

    // Busca o histórico de ausências de um funcionário específico (Para a aba de Perfil)
    List<Absence> findByEmployeeIdOrderByStartDateDesc(UUID employeeId);

    // --- AS BUSCAS PARA O RELATÓRIO DIÁRIO ---

    // 1. Ausentes Hoje (Início <= Hoje E Fim >= Hoje)
    @Query("SELECT a FROM Absence a WHERE a.startDate <= :today AND a.endDate >= :today AND a.status != 'CANCELADO'")
    List<Absence> findAbsencesToday(@Param("today") LocalDate today);

    // 2. De volta amanhã (A ausência termina exatamente hoje)
    @Query("SELECT a FROM Absence a WHERE a.endDate = :today AND a.status != 'CANCELADO'")
    List<Absence> findReturningTomorrow(@Param("today") LocalDate today);

    // 3. Próximas Ausências (Início no futuro, limitando pelo Java depois se necessário)
    @Query("SELECT a FROM Absence a WHERE a.startDate > :today AND a.status != 'CANCELADO' ORDER BY a.startDate ASC")
    List<Absence> findFutureAbsences(@Param("today") LocalDate today);

    // 4. Próximas ausências (janela de X dias para frente)
    @Query("SELECT a FROM Absence a WHERE a.startDate > :today AND a.startDate <= :limitDate AND a.status != 'CANCELADO' ORDER BY a.startDate ASC")
    List<Absence> findUpcomingAbsences(@Param("today") LocalDate today, @Param("limitDate") LocalDate limitDate);

}
