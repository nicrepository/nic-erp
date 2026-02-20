package com.niclabs.erp.inventory.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "it_assets", schema = "inventory")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ITAsset {

    @Id
    private UUID id;

    @Column(name = "serial_number", nullable = false)
    private String serialNumber;

    @Column(name = "asset_tag", nullable = false, unique = true)
    private String assetTag;

    @Column(nullable = false)
    private String model;

    @Column(nullable = false)
    private String brand;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssetStatus status;

    @Column(name = "assigned_to")
    private UUID assignedTo;
}
