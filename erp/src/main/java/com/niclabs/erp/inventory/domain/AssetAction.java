package com.niclabs.erp.inventory.domain;

public enum AssetAction {
    CREATED,    // Quando o equipamento é cadastrado
    ASSIGNED,   // Quando é entregue para um funcionário
    UNASSIGNED, // Quando é devolvido para a TI
    UPDATED     // Quando as especificações ou serial são alterados
}