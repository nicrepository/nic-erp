package com.niclabs.erp.statusreport.report.repository;

import com.niclabs.erp.statusreport.report.domain.StatusReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StatusReportRepository extends JpaRepository<StatusReport, UUID>, JpaSpecificationExecutor<StatusReport> {

    Optional<StatusReport> findByIdAndActiveTrue(UUID id);

    List<StatusReport> findByActiveTrueOrderByReportDateDescCreatedAtDesc();
}