package com.niclabs.erp.helpdesk.service;

import com.niclabs.erp.exception.DuplicateResourceException;
import com.niclabs.erp.exception.ResourceNotFoundException;
import com.niclabs.erp.helpdesk.domain.TicketCategory;
import com.niclabs.erp.helpdesk.dto.TicketCategoryRequestDTO;
import com.niclabs.erp.helpdesk.dto.TicketCategoryResponseDTO;
import com.niclabs.erp.helpdesk.repository.TicketCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TicketCategoryService implements ITicketCategoryService {

    private final TicketCategoryRepository ticketCategoryRepository;

    @Transactional(readOnly = true)
    public List<TicketCategoryResponseDTO> listAll() {
        return ticketCategoryRepository.findAllByOrderByNameAsc()
                .stream()
                .map(TicketCategoryResponseDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TicketCategoryResponseDTO> listActive() {
        return ticketCategoryRepository.findByActiveOrderByNameAsc(true)
                .stream()
                .map(TicketCategoryResponseDTO::fromEntity)
                .toList();
    }

    @Transactional
    public TicketCategoryResponseDTO create(TicketCategoryRequestDTO dto) {
        if (ticketCategoryRepository.existsByNameIgnoreCase(dto.name())) {
            throw new DuplicateResourceException("Já existe uma categoria com este nome.");
        }

        TicketCategory category = new TicketCategory();
        category.setId(UUID.randomUUID());
        category.setName(dto.name());
        category.setDescription(dto.description());
        category.setPriority(dto.priority());
        category.setDepartment(dto.department());
        category.setActive(dto.active());

        return TicketCategoryResponseDTO.fromEntity(ticketCategoryRepository.save(category));
    }

    @Transactional
    public TicketCategoryResponseDTO update(UUID id, TicketCategoryRequestDTO dto) {
        TicketCategory category = ticketCategoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada."));

        category.setName(dto.name());
        category.setDescription(dto.description());
        category.setPriority(dto.priority());
        category.setDepartment(dto.department());
        category.setActive(dto.active());

        return TicketCategoryResponseDTO.fromEntity(ticketCategoryRepository.save(category));
    }

    @Transactional
    public void delete(UUID id) {
        TicketCategory category = ticketCategoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada."));

        ticketCategoryRepository.delete(category);
    }
}
