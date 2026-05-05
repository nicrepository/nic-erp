package com.niclabs.erp.fiscal.service;

import com.niclabs.erp.fiscal.domain.FiscalAttachmentType;
import com.niclabs.erp.fiscal.domain.FiscalInvoiceStatus;
import com.niclabs.erp.fiscal.dto.FiscalInvoiceAttachmentResponseDTO;
import com.niclabs.erp.fiscal.dto.FiscalInvoiceRequestDTO;
import com.niclabs.erp.fiscal.dto.FiscalInvoiceResponseDTO;
import com.niclabs.erp.fiscal.dto.SupplierRequestDTO;
import com.niclabs.erp.fiscal.dto.SupplierResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface IFiscalService {

    SupplierResponseDTO createSupplier(SupplierRequestDTO dto);

    SupplierResponseDTO updateSupplier(UUID id, SupplierRequestDTO dto);

    void deactivateSupplier(UUID id);

    Page<SupplierResponseDTO> findSuppliers(String search, Pageable pageable);

    FiscalInvoiceResponseDTO createInvoice(FiscalInvoiceRequestDTO dto);

    FiscalInvoiceResponseDTO updateInvoice(UUID id, FiscalInvoiceRequestDTO dto);

    FiscalInvoiceResponseDTO updateInvoiceStatus(UUID id, FiscalInvoiceStatus status, String divergenceNotes);

    FiscalInvoiceResponseDTO launchInvoice(UUID id);

    FiscalInvoiceResponseDTO getInvoice(UUID id);

    Page<FiscalInvoiceResponseDTO> findInvoices(String search, FiscalInvoiceStatus status, Pageable pageable);

    FiscalInvoiceAttachmentResponseDTO addAttachment(UUID invoiceId, FiscalAttachmentType type, MultipartFile file);
}
