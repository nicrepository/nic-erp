package com.niclabs.erp.statusreport.report.dto;

import com.niclabs.erp.statusreport.report.domain.DifficultyLevel;
import com.niclabs.erp.statusreport.report.domain.StatusSituation;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;

public class CreateStatusReportRequest {
    @NotNull private UUID sapPartnerId;
    @NotNull private UUID finalCustomerId;
    @NotNull private LocalDate reportDate;
    @NotBlank private String involvedPeople;
    @NotBlank private String activity;
    @NotBlank private String dailyStatus;
    private DifficultyLevel difficultyLevel;
    private StatusSituation situation;

    // Getters e Setters
    public UUID getSapPartnerId() { return sapPartnerId; }
    public void setSapPartnerId(UUID sapPartnerId) { this.sapPartnerId = sapPartnerId; }
    public UUID getFinalCustomerId() { return finalCustomerId; }
    public void setFinalCustomerId(UUID finalCustomerId) { this.finalCustomerId = finalCustomerId; }
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
    public void setSituation(StatusSituation setSituation) { this.situation = setSituation; }
}