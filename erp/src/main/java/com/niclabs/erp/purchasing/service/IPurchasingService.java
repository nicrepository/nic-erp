package com.niclabs.erp.purchasing.service;

import com.niclabs.erp.purchasing.domain.PurchaseOrderStatus;
import com.niclabs.erp.purchasing.domain.PurchaseRequestStatus;
import com.niclabs.erp.purchasing.dto.PurchaseOrderDTO;
import com.niclabs.erp.purchasing.dto.PurchaseOrderResponseDTO;
import com.niclabs.erp.purchasing.dto.PurchaseReceiptDTO;
import com.niclabs.erp.purchasing.dto.PurchaseRequestDTO;
import com.niclabs.erp.purchasing.dto.PurchaseRequestResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface IPurchasingService {

    PurchaseRequestResponseDTO createRequest(PurchaseRequestDTO dto);

    PurchaseRequestResponseDTO updateRequest(UUID id, PurchaseRequestDTO dto);

    PurchaseRequestResponseDTO updateRequestStatus(UUID id, PurchaseRequestStatus status, String rejectionReason);

    PurchaseRequestResponseDTO getRequest(UUID id);

    Page<PurchaseRequestResponseDTO> findRequests(String search, PurchaseRequestStatus status, Pageable pageable);

    PurchaseOrderResponseDTO createOrder(PurchaseOrderDTO dto);

    PurchaseOrderResponseDTO updateOrder(UUID id, PurchaseOrderDTO dto);

    PurchaseOrderResponseDTO updateOrderStatus(UUID id, PurchaseOrderStatus status);

    PurchaseOrderResponseDTO receiveOrder(UUID id, PurchaseReceiptDTO dto);

    PurchaseOrderResponseDTO getOrder(UUID id);

    Page<PurchaseOrderResponseDTO> findOrders(String search, PurchaseOrderStatus status, Pageable pageable);
}
