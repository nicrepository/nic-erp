package com.niclabs.erp.statusreport.company.dto;

import com.niclabs.erp.statusreport.company.domain.CompanyType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CreateStatusReportCompanyRequest {
    @NotBlank(message = "O nome da empresa é obrigatório")
    private String name;

    @NotNull(message = "O tipo da empresa é obrigatório")
    private CompanyType type;

    private String notes;

    // Getters e Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public CompanyType getType() { return type; }
    public void setType(CompanyType type) { this.type = type; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}