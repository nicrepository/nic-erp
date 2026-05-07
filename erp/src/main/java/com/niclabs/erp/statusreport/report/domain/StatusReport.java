package com.niclabs.erp.statusreport.report.domain;

import com.niclabs.erp.statusreport.company.domain.StatusReportCompany;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "status_reports")
public class StatusReport {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "strategic_level", nullable = false, length = 30)
    private StrategicLevel strategicLevel = StrategicLevel.PENDING;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sap_partner_id", nullable = false)
    private StatusReportCompany sapPartner;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "final_customer_id", nullable = false)
    private StatusReportCompany finalCustomer;

    @Column(name = "report_date", nullable = false)
    private LocalDate reportDate;

    @Column(name = "involved_people", nullable = false, columnDefinition = "TEXT")
    private String involvedPeople;

    @Column(name = "activity", nullable = false, columnDefinition = "TEXT")
    private String activity;

    @Column(name = "daily_status", nullable = false, columnDefinition = "TEXT")
    private String dailyStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "difficulty_level", nullable = false, length = 30)
    private DifficultyLevel difficultyLevel = DifficultyLevel.NOT_INFORMED;

    @Enumerated(EnumType.STRING)
    @Column(name = "situation", nullable = false, length = 50)
    private StatusSituation situation = StatusSituation.NOT_INFORMED;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @Column(name = "created_by", length = 150)
    private String createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_by", length = 150)
    private String updatedBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public StatusReport() {
    }

    @PrePersist
    public void prePersist() {
        if (id == null) {
            id = UUID.randomUUID();
        }

        if (strategicLevel == null) {
            strategicLevel = StrategicLevel.PENDING;
        }

        if (difficultyLevel == null) {
            difficultyLevel = DifficultyLevel.NOT_INFORMED;
        }

        if (situation == null) {
            situation = StatusSituation.NOT_INFORMED;
        }

        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }

        active = true;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();

        if (strategicLevel == null) {
            strategicLevel = StrategicLevel.PENDING;
        }

        if (difficultyLevel == null) {
            difficultyLevel = DifficultyLevel.NOT_INFORMED;
        }

        if (situation == null) {
            situation = StatusSituation.NOT_INFORMED;
        }
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public StrategicLevel getStrategicLevel() {
        return strategicLevel;
    }

    public void setStrategicLevel(StrategicLevel strategicLevel) {
        this.strategicLevel = strategicLevel;
    }

    public StatusReportCompany getSapPartner() {
        return sapPartner;
    }

    public void setSapPartner(StatusReportCompany sapPartner) {
        this.sapPartner = sapPartner;
    }

    public StatusReportCompany getFinalCustomer() {
        return finalCustomer;
    }

    public void setFinalCustomer(StatusReportCompany finalCustomer) {
        this.finalCustomer = finalCustomer;
    }

    public LocalDate getReportDate() {
        return reportDate;
    }

    public void setReportDate(LocalDate reportDate) {
        this.reportDate = reportDate;
    }

    public String getInvolvedPeople() {
        return involvedPeople;
    }

    public void setInvolvedPeople(String involvedPeople) {
        this.involvedPeople = involvedPeople;
    }

    public String getActivity() {
        return activity;
    }

    public void setActivity(String activity) {
        this.activity = activity;
    }

    public String getDailyStatus() {
        return dailyStatus;
    }

    public void setDailyStatus(String dailyStatus) {
        this.dailyStatus = dailyStatus;
    }

    public DifficultyLevel getDifficultyLevel() {
        return difficultyLevel;
    }

    public void setDifficultyLevel(DifficultyLevel difficultyLevel) {
        this.difficultyLevel = difficultyLevel;
    }

    public StatusSituation getSituation() {
        return situation;
    }

    public void setSituation(StatusSituation situation) {
        this.situation = situation;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}