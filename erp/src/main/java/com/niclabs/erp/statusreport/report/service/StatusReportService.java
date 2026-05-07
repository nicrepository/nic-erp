package com.niclabs.erp.statusreport.report.service;

import com.niclabs.erp.statusreport.company.domain.CompanyType;
import com.niclabs.erp.statusreport.company.domain.StatusReportCompany;
import com.niclabs.erp.statusreport.company.repository.StatusReportCompanyRepository;
import com.niclabs.erp.statusreport.report.domain.DifficultyLevel;
import com.niclabs.erp.statusreport.report.domain.StatusReport;
import com.niclabs.erp.statusreport.report.domain.StatusSituation;
import com.niclabs.erp.statusreport.report.domain.StrategicLevel;
import com.niclabs.erp.statusreport.report.dto.CreateStatusReportRequest;
import com.niclabs.erp.statusreport.report.dto.StatusReportResponse;
import com.niclabs.erp.statusreport.report.dto.UpdateStrategicLevelRequest;
import com.niclabs.erp.statusreport.report.dto.UpdateStatusReportRequest;
import com.niclabs.erp.statusreport.report.repository.StatusReportRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class StatusReportService {

    private final StatusReportRepository repository;
    private final StatusReportCompanyRepository companyRepository;

    public StatusReportService(
            StatusReportRepository repository,
            StatusReportCompanyRepository companyRepository
    ) {
        this.repository = repository;
        this.companyRepository = companyRepository;
    }

    @Transactional(readOnly = true)
    public List<StatusReportResponse> findAll() {
        return repository.findByActiveTrueOrderByReportDateDescCreatedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public StatusReportResponse findById(UUID id) {
        StatusReport report = repository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new RuntimeException("Status Report não encontrado"));

        return mapToResponse(report);
    }

    @Transactional
    public StatusReportResponse create(CreateStatusReportRequest request, Principal principal) {
        StatusReportCompany partner = companyRepository.findByIdAndActiveTrue(request.getSapPartnerId())
                .orElseThrow(() -> new RuntimeException("Parceiro não encontrado ou inativo"));

        StatusReportCompany customer = companyRepository.findByIdAndActiveTrue(request.getFinalCustomerId())
                .orElseThrow(() -> new RuntimeException("Cliente não encontrado ou inativo"));

        validatePartnerType(partner);
        validateCustomerType(customer);

        StatusReport report = new StatusReport();
        report.setSapPartner(partner);
        report.setFinalCustomer(customer);
        report.setReportDate(request.getReportDate());
        report.setInvolvedPeople(trim(request.getInvolvedPeople()));
        report.setActivity(trim(request.getActivity()));
        report.setDailyStatus(trim(request.getDailyStatus()));
        report.setDifficultyLevel(resolveDifficulty(request.getDifficultyLevel()));
        report.setSituation(resolveSituation(request.getSituation()));
        report.setStrategicLevel(StrategicLevel.PENDING);
        report.setCreatedBy(getCurrentUser(principal));

        StatusReport saved = repository.save(report);

        return mapToResponse(saved);
    }

    @Transactional
    public StatusReportResponse update(UUID id, UpdateStatusReportRequest request, Principal principal) {
        StatusReport report = repository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new RuntimeException("Status Report não encontrado"));

        StatusReportCompany partner = companyRepository.findByIdAndActiveTrue(request.getSapPartnerId())
                .orElseThrow(() -> new RuntimeException("Parceiro não encontrado ou inativo"));

        StatusReportCompany customer = companyRepository.findByIdAndActiveTrue(request.getFinalCustomerId())
                .orElseThrow(() -> new RuntimeException("Cliente não encontrado ou inativo"));

        validatePartnerType(partner);
        validateCustomerType(customer);

        report.setSapPartner(partner);
        report.setFinalCustomer(customer);
        report.setReportDate(request.getReportDate());
        report.setInvolvedPeople(trim(request.getInvolvedPeople()));
        report.setActivity(trim(request.getActivity()));
        report.setDailyStatus(trim(request.getDailyStatus()));
        report.setDifficultyLevel(resolveDifficulty(request.getDifficultyLevel()));
        report.setSituation(resolveSituation(request.getSituation()));
        report.setUpdatedBy(getCurrentUser(principal));
        report.setUpdatedAt(LocalDateTime.now());

        StatusReport saved = repository.save(report);

        return mapToResponse(saved);
    }

    @Transactional
    public void updateStrategicLevel(UUID id, StrategicLevel level, Principal principal) {
        StatusReport report = repository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new RuntimeException("Status Report não encontrado"));

        report.setStrategicLevel(level);
        report.setUpdatedBy(getCurrentUser(principal));
        report.setUpdatedAt(LocalDateTime.now());

        repository.save(report);
    }

    @Transactional
    public void updateStrategicLevel(UUID id, UpdateStrategicLevelRequest request, Principal principal) {
        updateStrategicLevel(id, request.getStrategicLevel(), principal);
    }

    @Transactional
    public void delete(UUID id, Principal principal) {
        StatusReport report = repository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new RuntimeException("Status Report não encontrado"));

        report.setActive(false);
        report.setUpdatedBy(getCurrentUser(principal));
        report.setUpdatedAt(LocalDateTime.now());

        repository.save(report);
    }

    private void validatePartnerType(StatusReportCompany company) {
        if (company.getType() != CompanyType.SAP_PARTNER
                && company.getType() != CompanyType.DIRECT_CUSTOMER) {
            throw new RuntimeException("Parceiro SAP deve ser do tipo SAP_PARTNER ou DIRECT_CUSTOMER");
        }
    }

    private void validateCustomerType(StatusReportCompany company) {
        if (company.getType() != CompanyType.FINAL_CUSTOMER
                && company.getType() != CompanyType.DIRECT_CUSTOMER) {
            throw new RuntimeException("Cliente final deve ser do tipo FINAL_CUSTOMER ou DIRECT_CUSTOMER");
        }
    }

    private DifficultyLevel resolveDifficulty(DifficultyLevel difficultyLevel) {
        return difficultyLevel != null ? difficultyLevel : DifficultyLevel.NOT_INFORMED;
    }

    private StatusSituation resolveSituation(StatusSituation situation) {
        return situation != null ? situation : StatusSituation.NOT_INFORMED;
    }

    private String getCurrentUser(Principal principal) {
        return principal != null ? principal.getName() : "system";
    }

    private String trim(String value) {
        return value != null ? value.trim() : null;
    }

    private StatusReportResponse mapToResponse(StatusReport entity) {
        StatusReportResponse dto = new StatusReportResponse();

        dto.setId(entity.getId());
        dto.setStrategicLevel(entity.getStrategicLevel());

        if (entity.getSapPartner() != null) {
            dto.setSapPartnerId(entity.getSapPartner().getId());
            dto.setSapPartnerName(entity.getSapPartner().getName());
        }

        if (entity.getFinalCustomer() != null) {
            dto.setFinalCustomerId(entity.getFinalCustomer().getId());
            dto.setFinalCustomerName(entity.getFinalCustomer().getName());
        }

        dto.setReportDate(entity.getReportDate());
        dto.setInvolvedPeople(entity.getInvolvedPeople());
        dto.setActivity(entity.getActivity());
        dto.setDailyStatus(entity.getDailyStatus());
        dto.setDifficultyLevel(entity.getDifficultyLevel());
        dto.setSituation(entity.getSituation());

        return dto;
    }
}