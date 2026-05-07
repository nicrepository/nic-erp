package com.niclabs.erp.statusreport.report.dto;

import com.niclabs.erp.statusreport.report.domain.StrategicLevel;
import jakarta.validation.constraints.NotNull;

public class UpdateStrategicLevelRequest {
    @NotNull private StrategicLevel strategicLevel;

    public StrategicLevel getStrategicLevel() { return strategicLevel; }
    public void setStrategicLevel(StrategicLevel strategicLevel) { this.strategicLevel = strategicLevel; }
}