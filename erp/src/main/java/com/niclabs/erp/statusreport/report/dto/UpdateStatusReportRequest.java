package com.niclabs.erp.statusreport.report.dto;

import com.niclabs.erp.statusreport.report.domain.DifficultyLevel;
import com.niclabs.erp.statusreport.report.domain.StatusSituation;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public class UpdateStatusReportRequest {

    @NotNull(message = "Parceiro SAP é obrigatório.")
    private UUID sapPartnerId;

    @NotNull(message = "Cliente final é obrigatório.")
    private UUID finalCustomerId;

    @NotNull(message = "Data é obrigatória.")
    private LocalDate reportDate;

    @NotBlank(message = "Envolvidos é obrigatório.")
    private String involvedPeople;

    @NotBlank(message = "Atividade é obrigatória.")
    private String activity;

    @NotBlank(message = "Status diário é obrigatório.")
    private String dailyStatus;

    @NotNull(message = "Dificuldade é obrigatória.")
    private DifficultyLevel difficultyLevel;

    @NotNull(message = "Situação é obrigatória.")
    private StatusSituation situation;

    public UUID getSapPartnerId() {
        return sapPartnerId;
    }

    public void setSapPartnerId(UUID sapPartnerId) {
        this.sapPartnerId = sapPartnerId;
    }

    public UUID getFinalCustomerId() {
        return finalCustomerId;
    }

    public void setFinalCustomerId(UUID finalCustomerId) {
        this.finalCustomerId = finalCustomerId;
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
}