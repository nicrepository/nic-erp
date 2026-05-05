package com.niclabs.erp.fiscal.repository;

import com.niclabs.erp.fiscal.domain.FiscalInvoiceAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface FiscalInvoiceAttachmentRepository extends JpaRepository<FiscalInvoiceAttachment, UUID> {
}
