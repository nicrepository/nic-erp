package com.niclabs.erp.fiscal.controller;

import com.niclabs.erp.fiscal.domain.FiscalAttachmentType;
import com.niclabs.erp.fiscal.domain.FiscalInvoiceStatus;
import com.niclabs.erp.fiscal.dto.FiscalInvoiceAttachmentResponseDTO;
import com.niclabs.erp.fiscal.dto.FiscalInvoiceRequestDTO;
import com.niclabs.erp.fiscal.dto.FiscalInvoiceResponseDTO;
import com.niclabs.erp.fiscal.dto.SupplierRequestDTO;
import com.niclabs.erp.fiscal.dto.SupplierResponseDTO;
import com.niclabs.erp.fiscal.service.IFiscalService;
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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/fiscal")
@RequiredArgsConstructor
@Tag(name = "Fiscal", description = "Gestão de fornecedores e notas fiscais recebidas")
@PreAuthorize("hasAuthority('ACCESS_FISCAL') or hasAuthority('ROLE_ADMIN')")
public class FiscalController {

    private static final int MAX_PAGE_SIZE = 100;
    private static final Set<String> SUPPLIER_SORT_FIELDS = Set.of("legalName", "tradeName", "document", "category", "active");
    private static final Set<String> INVOICE_SORT_FIELDS = Set.of("issueDate", "receivedDate", "number", "status", "totalValue", "createdAt");

    private final IFiscalService fiscalService;

    @PostMapping("/suppliers")
    public ResponseEntity<SupplierResponseDTO> createSupplier(@Valid @RequestBody SupplierRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(fiscalService.createSupplier(dto));
    }

    @GetMapping("/suppliers")
    public ResponseEntity<Page<SupplierResponseDTO>> listSuppliers(
            @RequestParam(required = false) String search,
            @PageableDefault(size = 10, sort = "legalName") Pageable pageable) {
        return ResponseEntity.ok(fiscalService.findSuppliers(normalizeSearch(search), sanitizePageable(pageable, SUPPLIER_SORT_FIELDS, "legalName")));
    }

    @PutMapping("/suppliers/{id}")
    public ResponseEntity<SupplierResponseDTO> updateSupplier(@PathVariable UUID id, @Valid @RequestBody SupplierRequestDTO dto) {
        return ResponseEntity.ok(fiscalService.updateSupplier(id, dto));
    }

    @DeleteMapping("/suppliers/{id}")
    public ResponseEntity<Void> deactivateSupplier(@PathVariable UUID id) {
        fiscalService.deactivateSupplier(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/invoices")
    public ResponseEntity<FiscalInvoiceResponseDTO> createInvoice(@Valid @RequestBody FiscalInvoiceRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(fiscalService.createInvoice(dto));
    }

    @GetMapping("/invoices")
    public ResponseEntity<Page<FiscalInvoiceResponseDTO>> listInvoices(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) FiscalInvoiceStatus status,
            @PageableDefault(size = 10, sort = "issueDate", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(fiscalService.findInvoices(normalizeSearch(search), status, sanitizePageable(pageable, INVOICE_SORT_FIELDS, "issueDate")));
    }

    @GetMapping("/invoices/{id}")
    public ResponseEntity<FiscalInvoiceResponseDTO> getInvoice(@PathVariable UUID id) {
        return ResponseEntity.ok(fiscalService.getInvoice(id));
    }

    @PutMapping("/invoices/{id}")
    public ResponseEntity<FiscalInvoiceResponseDTO> updateInvoice(@PathVariable UUID id, @Valid @RequestBody FiscalInvoiceRequestDTO dto) {
        return ResponseEntity.ok(fiscalService.updateInvoice(id, dto));
    }

    @PutMapping("/invoices/{id}/status")
    public ResponseEntity<FiscalInvoiceResponseDTO> updateInvoiceStatus(
            @PathVariable UUID id,
            @RequestParam FiscalInvoiceStatus status,
            @RequestParam(required = false) String divergenceNotes) {
        return ResponseEntity.ok(fiscalService.updateInvoiceStatus(id, status, divergenceNotes));
    }

    @PostMapping("/invoices/{id}/launch")
    public ResponseEntity<FiscalInvoiceResponseDTO> launchInvoice(@PathVariable UUID id) {
        return ResponseEntity.ok(fiscalService.launchInvoice(id));
    }

    @PostMapping(value = "/invoices/{id}/attachments", consumes = "multipart/form-data")
    public ResponseEntity<FiscalInvoiceAttachmentResponseDTO> addAttachment(
            @PathVariable UUID id,
            @RequestParam FiscalAttachmentType type,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED).body(fiscalService.addAttachment(id, type, file));
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

        Sort sort = safeOrders.isEmpty()
                ? Sort.by(Sort.Order.asc(defaultSortField))
                : Sort.by(safeOrders);

        return PageRequest.of(page, size, sort);
    }
}
