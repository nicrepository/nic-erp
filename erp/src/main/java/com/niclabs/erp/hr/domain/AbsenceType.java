package com.niclabs.erp.hr.domain;

public enum AbsenceType {
    FERIAS,
    DAY_OFF,
    ATESTADO,
    LICENCA;

    /** Mapeia o tipo de ausência para o status que o colaborador assume enquanto está ausente. */
    public EmployeeStatus toEmployeeStatus() {
        return this == FERIAS ? EmployeeStatus.FERIAS : EmployeeStatus.AFASTADO;
    }
}
