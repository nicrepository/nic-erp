package com.niclabs.erp.statusreport.company.repository;

import com.niclabs.erp.statusreport.company.domain.StatusReportCompany;
import com.niclabs.erp.statusreport.company.domain.CompanyType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StatusReportCompanyRepository extends JpaRepository<StatusReportCompany, UUID> {

    /**
     * Busca uma empresa pelo ID, garantindo que ela esteja ativa.
     * Importante para integridade referencial no Status Report.
     */
    Optional<StatusReportCompany> findByIdAndActiveTrue(UUID id);

    /**
     * Consulta customizada com JPQL para busca dinâmica.
     * Filtra por tipo (se informado) e por parte do nome (case-insensitive).
     * Retorna apenas empresas com active = true.
     */
    @Query("SELECT c FROM StatusReportCompany c WHERE c.active = true " +
            "AND (:type IS NULL OR c.type = :type) " +
            "AND (:search IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<StatusReportCompany> findAllActive(
            @Param("type") CompanyType type,
            @Param("search") String search
    );
}