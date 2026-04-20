package com.niclabs.erp.helpdesk.controller;

import com.niclabs.erp.helpdesk.dto.TicketCategoryRequestDTO;
import com.niclabs.erp.helpdesk.dto.TicketCategoryResponseDTO;
import com.niclabs.erp.helpdesk.service.ITicketCategoryService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/helpdesk/categories")
@RequiredArgsConstructor
@Tag(name = "Helpdesk - Categorias")
public class TicketCategoryController {

    private final ITicketCategoryService ticketCategoryService;

    @GetMapping
    public List<TicketCategoryResponseDTO> listActive() {
        return ticketCategoryService.listActive();
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public List<TicketCategoryResponseDTO> listAll() {
        return ticketCategoryService.listAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public TicketCategoryResponseDTO create(@Valid @RequestBody TicketCategoryRequestDTO dto) {
        return ticketCategoryService.create(dto);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public TicketCategoryResponseDTO update(@PathVariable UUID id,
                                            @Valid @RequestBody TicketCategoryRequestDTO dto) {
        return ticketCategoryService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public void delete(@PathVariable UUID id) {
        ticketCategoryService.delete(id);
    }
}
