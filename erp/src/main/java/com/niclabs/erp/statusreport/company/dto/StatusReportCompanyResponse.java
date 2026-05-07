package com.niclabs.erp.statusreport.company.dto;

import com.niclabs.erp.statusreport.company.domain.CompanyType;
import java.util.UUID;

public class StatusReportCompanyResponse {
    private UUID id;
    private String name;
    private CompanyType type;
    private boolean active;
    private String notes;

    // Getters e Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public CompanyType getType() { return type; }
    public void setType(CompanyType type) { this.type = type; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}