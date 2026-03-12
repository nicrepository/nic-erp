package com.niclabs.erp.inventory.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "it_asset_history", schema = "inventory")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ITAssetHistory {

    @Id
    private UUID id;

    @Column(name = "asset_id", nullable = false)
    private UUID assetId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssetAction action;

    // Quem fez a alteração no sistema (O usuário da TI)
    @Column(name = "performed_by", nullable = false)
    private UUID performedBy;

    // Para quem o equipamento foi entregue (Pode ser nulo se for devolução/criação)
    @Column(name = "assigned_to_user")
    private UUID assignedToUser;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}