package com.niclabs.erp.statusreport.report.dto;

import com.niclabs.erp.statusreport.report.domain.DifficultyLevel;
import com.niclabs.erp.statusreport.report.domain.StatusSituation;
import com.niclabs.erp.statusreport.report.domain.StrategicLevel;

import java.time.LocalDate;
import java.util.UUID;

public class StatusReportResponse {
    private UUID id;
    private StrategicLevel strategicLevel;
    private UUID sapPartnerId;
    private String sapPartnerName;
    private UUID finalCustomerId;
    private String finalCustomerName;
    private LocalDate reportDate;
    private String involvedPeople;
    private String activity;
    private String dailyStatus;
    private DifficultyLevel difficultyLevel;
    private StatusSituation situation;

    // Getters e Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public StrategicLevel getStrategicLevel() { return strategicLevel; }
    public void setStrategicLevel(StrategicLevel strategicLevel) { this.strategicLevel = strategicLevel; }

    public UUID getSapPartnerId() { return sapPartnerId; }
    public void setSapPartnerId(UUID sapPartnerId) { this.sapPartnerId = sapPartnerId; }

    public String getSapPartnerName() { return sapPartnerName; }
    public void setSapPartnerName(String sapPartnerName) { this.sapPartnerName = sapPartnerName; }

    public UUID getFinalCustomerId() { return finalCustomerId; }
    public void setFinalCustomerId(UUID finalCustomerId) { this.finalCustomerId = finalCustomerId; }

    public String getFinalCustomerName() { return finalCustomerName; }
    public void setFinalCustomerName(String finalCustomerName) { this.finalCustomerName = finalCustomerName; }

    public LocalDate getReportDate() { return reportDate; }
    public void setReportDate(LocalDate reportDate) { this.reportDate = reportDate; }

    public String getInvolvedPeople() { return involvedPeople; }
    public void setInvolvedPeople(String involvedPeople) { this.involvedPeople = involvedPeople; }

    public String getActivity() { return activity; }
    public void setActivity(String activity) { this.activity = activity; }

    public String getDailyStatus() { return dailyStatus; }
    public void setDailyStatus(String dailyStatus) { this.dailyStatus = dailyStatus; }

    public DifficultyLevel getDifficultyLevel() { return difficultyLevel; }
    public void setDifficultyLevel(DifficultyLevel difficultyLevel) { this.difficultyLevel = difficultyLevel; }

    public StatusSituation getSituation() { return situation; }
    public void setSituation(StatusSituation situation) { this.situation = situation; }
}