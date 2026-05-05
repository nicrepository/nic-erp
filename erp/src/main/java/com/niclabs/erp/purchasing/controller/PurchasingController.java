package com.niclabs.erp.purchasing.controller;

import com.niclabs.erp.purchasing.domain.PurchaseOrderStatus;
import com.niclabs.erp.purchasing.domain.PurchaseRequestStatus;
import com.niclabs.erp.purchasing.dto.PurchaseOrderDTO;
import com.niclabs.erp.purchasing.dto.PurchaseOrderResponseDTO;
import com.niclabs.erp.purchasing.dto.PurchaseReceiptDTO;
import com.niclabs.erp.purchasing.dto.PurchaseRequestDTO;
import com.niclabs.erp.purchasing.dto.PurchaseRequestResponseDTO;
import com.niclabs.erp.purchasing.service.IPurchasingService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/purchasing")
@RequiredArgsConstructor
@Tag(name = "Compras", description = "Solicitações e pedidos de compra")
@PreAuthorize("hasAuthority('ACCESS_PURCHASES') or hasAuthority('ROLE_ADMIN')")
public class PurchasingController {

    private static final int MAX_PAGE_SIZE = 100;
    private static final Set<String> REQUEST_SORT_FIELDS = Set.of("createdAt", "title", "status", "costCenter");
    private static final Set<String> ORDER_SORT_FIELDS = Set.of("createdAt", "issueDate", "number", "status", "totalEstimatedValue");

    private final IPurchasingService purchasingService;

    @PostMapping("/requests")
    public ResponseEntity<PurchaseRequestResponseDTO> createRequest(@Valid @RequestBody PurchaseRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(purchasingService.createRequest(dto));
    }

    @GetMapping("/requests")
    public ResponseEntity<Page<PurchaseRequestResponseDTO>> listRequests(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) PurchaseRequestStatus status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(purchasingService.findRequests(normalizeSearch(search), status, sanitizePageable(pageable, REQUEST_SORT_FIELDS, "createdAt")));
    }

    @GetMapping("/requests/{id}")
    public ResponseEntity<PurchaseRequestResponseDTO> getRequest(@PathVariable UUID id) {
        return ResponseEntity.ok(purchasingService.getRequest(id));
    }

    @PutMapping("/requests/{id}")
    public ResponseEntity<PurchaseRequestResponseDTO> updateRequest(@PathVariable UUID id, @Valid @RequestBody PurchaseRequestDTO dto) {
        return ResponseEntity.ok(purchasingService.updateRequest(id, dto));
    }

    @PutMapping("/requests/{id}/status")
    public ResponseEntity<PurchaseRequestResponseDTO> updateRequestStatus(
            @PathVariable UUID id,
            @RequestParam PurchaseRequestStatus status,
            @RequestParam(required = false) String rejectionReason) {
        return ResponseEntity.ok(purchasingService.updateRequestStatus(id, status, rejectionReason));
    }

    @PostMapping("/orders")
    public ResponseEntity<PurchaseOrderResponseDTO> createOrder(@Valid @RequestBody PurchaseOrderDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(purchasingService.createOrder(dto));
    }

    @GetMapping("/orders")
    public ResponseEntity<Page<PurchaseOrderResponseDTO>> listOrders(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) PurchaseOrderStatus status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(purchasingService.findOrders(normalizeSearch(search), status, sanitizePageable(pageable, ORDER_SORT_FIELDS, "createdAt")));
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<PurchaseOrderResponseDTO> getOrder(@PathVariable UUID id) {
        return ResponseEntity.ok(purchasingService.getOrder(id));
    }

    @PutMapping("/orders/{id}")
    public ResponseEntity<PurchaseOrderResponseDTO> updateOrder(@PathVariable UUID id, @Valid @RequestBody PurchaseOrderDTO dto) {
        return ResponseEntity.ok(purchasingService.updateOrder(id, dto));
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<PurchaseOrderResponseDTO> updateOrderStatus(@PathVariable UUID id, @RequestParam PurchaseOrderStatus status) {
        return ResponseEntity.ok(purchasingService.updateOrderStatus(id, status));
    }

    @PostMapping("/orders/{id}/receive")
    public ResponseEntity<PurchaseOrderResponseDTO> receiveOrder(@PathVariable UUID id, @Valid @RequestBody PurchaseReceiptDTO dto) {
        return ResponseEntity.ok(purchasingService.receiveOrder(id, dto));
    }

    private String normalizeSearch(String search) {
        if (search == null) return "";
        String normalized = search.trim();
        return normalized.length() > 100 ? normalized.substring(0, 100) : normalized;
    }

    private Pageable sanitizePageable(Pageable pageable, Set<String> allowedSortFields, String defaultSortField) {
        int page = Math.max(0, pageable.getPageNumber());
        int size = Math.min(Math.max(1, pageable.getPageSize()), MAX_PAGE_SIZE);
        Set<String> usedProperties = new HashSet<>();
        List<Sort.Order> safeOrders = pageable.getSort().stream()
                .filter(order -> allowedSortFields.contains(order.getProperty()))
                .filter(order -> usedProperties.add(order.getProperty()))
                .map(order -> new Sort.Order(order.getDirection(), order.getProperty()))
                .toList();
        Sort sort = safeOrders.isEmpty() ? Sort.by(Sort.Order.asc(defaultSortField)) : Sort.by(safeOrders);
        return PageRequest.of(page, size, sort);
    }
}
