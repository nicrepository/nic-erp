package com.niclabs.erp.statusreport.company.service;

import com.niclabs.erp.statusreport.company.domain.StatusReportCompany;
import com.niclabs.erp.statusreport.company.dto.*;
import com.niclabs.erp.statusreport.company.repository.StatusReportCompanyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class StatusReportCompanyService {

    private final StatusReportCompanyRepository repository;

    public StatusReportCompanyService(StatusReportCompanyRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public StatusReportCompanyResponse create(CreateStatusReportCompanyRequest request, Principal principal) {
        StatusReportCompany company = new StatusReportCompany();
        company.setName(request.getName());
        company.setType(request.getType());
        company.setNotes(request.getNotes());
        company.setCreatedBy(principal.getName());

        return mapToResponse(repository.save(company));
    }

    public List<StatusReportCompanyResponse> findAllActive(String search) {
        // Implementação simplificada de busca por nome
        return repository.findAll().stream()
                .filter(c -> c.isActive() && (search == null || c.getName().toLowerCase().contains(search.toLowerCase())))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void delete(UUID id, Principal principal) {
        StatusReportCompany company = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Empresa não encontrada"));
        company.setActive(false);
        company.setUpdatedBy(principal.getName());
        company.setUpdatedAt(LocalDateTime.now());
        repository.save(company);
    }

    private StatusReportCompanyResponse mapToResponse(StatusReportCompany company) {
        StatusReportCompanyResponse res = new StatusReportCompanyResponse();
        res.setId(company.getId());
        res.setName(company.getName());
        res.setType(company.getType());
        res.setActive(company.isActive());
        res.setNotes(company.getNotes());
        return res;
    }
}