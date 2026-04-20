package com.niclabs.erp.helpdesk.service;

import com.niclabs.erp.helpdesk.dto.TicketCategoryRequestDTO;
import com.niclabs.erp.helpdesk.dto.TicketCategoryResponseDTO;

import java.util.List;
import java.util.UUID;

public interface ITicketCategoryService {

    List<TicketCategoryResponseDTO> listAll();

    List<TicketCategoryResponseDTO> listActive();

    TicketCategoryResponseDTO create(TicketCategoryRequestDTO dto);

    TicketCategoryResponseDTO update(UUID id, TicketCategoryRequestDTO dto);

    void delete(UUID id);
}
