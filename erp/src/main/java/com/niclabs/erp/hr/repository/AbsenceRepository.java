package com.niclabs.erp.hr.repository;

import com.niclabs.erp.hr.domain.Absence;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface AbsenceRepository extends JpaRepository<Absence, UUID> {

    List<Absence> findByEmployeeIdOrderByStartDateDesc(UUID employeeId);

    @Query("SELECT a FROM Absence a JOIN FETCH a.employee")
    Page<Absence> findAllWithEmployee(Pageable pageable);

    @Query("SELECT a FROM Absence a JOIN FETCH a.employee WHERE a.startDate <= :today AND a.endDate >= :today AND a.status != 'CANCELADO'")
    List<Absence> findAbsencesToday(@Param("today") LocalDate today);

    @Query("SELECT a FROM Absence a JOIN FETCH a.employee WHERE a.endDate = :today AND a.status != 'CANCELADO'")
    List<Absence> findReturningTomorrow(@Param("today") LocalDate today);

    @Query("SELECT a FROM Absence a JOIN FETCH a.employee WHERE a.startDate > :today AND a.status != 'CANCELADO' ORDER BY a.startDate ASC")
    List<Absence> findFutureAbsences(@Param("today") LocalDate today);

    @Query("SELECT a FROM Absence a JOIN FETCH a.employee WHERE a.startDate > :today AND a.startDate <= :limitDate AND a.status != 'CANCELADO' ORDER BY a.startDate ASC")
    List<Absence> findUpcomingAbsences(@Param("today") LocalDate today, @Param("limitDate") LocalDate limitDate);

    @Query("SELECT a FROM Absence a WHERE a.employee.id = :employeeId AND a.startDate <= :date AND a.endDate >= :date AND a.status != 'CANCELADO'")
    List<Absence> findActiveAbsencesByEmployee(@Param("employeeId") UUID employeeId, @Param("date") LocalDate date);
}

