package com.niclabs.erp.fiscal.dto;

import com.niclabs.erp.common.AppConstants;
import com.niclabs.erp.fiscal.domain.FiscalAttachmentType;
import com.niclabs.erp.fiscal.domain.FiscalInvoiceAttachment;

import java.time.LocalDateTime;
import java.util.UUID;

public record FiscalInvoiceAttachmentResponseDTO(
        UUID id,
        String originalName,
        String fileName,
        String url,
        String contentType,
        FiscalAttachmentType attachmentType,
        UUID uploadedBy,
        LocalDateTime createdAt
) {
    public static FiscalInvoiceAttachmentResponseDTO fromEntity(FiscalInvoiceAttachment a) {
        return new FiscalInvoiceAttachmentResponseDTO(
                a.getId(),
                a.getOriginalName(),
                a.getFileName(),
                AppConstants.FILE_URL_PREFIX + a.getFileName(),
                a.getContentType(),
                a.getAttachmentType(),
                a.getUploadedBy(),
                a.getCreatedAt()
        );
    }
}
