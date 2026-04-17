package com.niclabs.erp.dashboard.service;

import com.niclabs.erp.dashboard.dto.DashboardResponseDTO;

/**
 * Contract for dashboard metric aggregation.
 *
 * <p>Aggregates read-only counters from multiple modules (Helpdesk, Inventory, Auth)
 * into a single payload suitable for the front-end summary cards.</p>
 */
public interface IDashboardService {

    /**
     * Collects and returns the current system-wide metrics snapshot.
     *
     * <p>This is a cross-module read operation spanning Helpdesk, IT assets,
     * stock items, and users. Results reflect the database state at the time of the call.</p>
     *
     * @return aggregated metric snapshot
     */
    DashboardResponseDTO getSystemMetrics();
}
