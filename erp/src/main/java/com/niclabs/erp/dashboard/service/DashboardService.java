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

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final TicketRepository ticketRepository;
    private final ITAssetRepository itAssetRepository;
    private final StockItemRepository stockItemRepository;
    private final UserRepository userRepository;

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
