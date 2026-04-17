package com.niclabs.erp.dashboard.service;

import com.niclabs.erp.auth.repository.UserRepository;
import com.niclabs.erp.dashboard.dto.DashboardResponseDTO;
import com.niclabs.erp.helpdesk.domain.TicketStatus;
import com.niclabs.erp.helpdesk.repository.TicketRepository;
import com.niclabs.erp.inventory.domain.AssetStatus;
import com.niclabs.erp.inventory.repository.ITAssetRepository;
import com.niclabs.erp.inventory.repository.StockItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Aggregates cross-module metrics for the executive dashboard view.
 *
 * <p>All operations are read-only; {@code readOnly = true} transactions allow the JPA
 * provider to skip dirty checking and optimise connection pool usage.</p>
 */
@Service
@RequiredArgsConstructor
public class DashboardService implements IDashboardService {

    private final TicketRepository ticketRepository;
    private final ITAssetRepository itAssetRepository;
    private final StockItemRepository stockItemRepository;
    private final UserRepository userRepository;

    /**
     * Returns a snapshot of key system metrics across helpdesk, IT assets, stock, and users.
     *
     * @return {@link DashboardResponseDTO} with current counts per category
     */
    @Transactional(readOnly = true)
    public DashboardResponseDTO getSystemMetrics() {
        return new DashboardResponseDTO(
                // Helpdesk
                ticketRepository.countByStatus(TicketStatus.OPEN),
                ticketRepository.countByStatus(TicketStatus.IN_PROGRESS),
                ticketRepository.countByStatus(TicketStatus.RESOLVED),

                // IT Assets
                itAssetRepository.count(),
                itAssetRepository.countByStatus(AssetStatus.AVAILABLE),
                itAssetRepository.countByStatus(AssetStatus.IN_USE),

                // Estoque Administrativo
                stockItemRepository.count(),
                stockItemRepository.countLowStockItems(),

                // Geral
                userRepository.count()
        );
    }
}
