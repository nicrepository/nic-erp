package com.niclabs.erp.inventory.domain;

public enum AssetStatus {
    AVAILABLE,   // Disponível no estoque
    IN_USE,      // Em uso por um colaborador
    MAINTENANCE, // Em manutenção
    WRITTEN_OFF     // Descartado/Aposentado
}
