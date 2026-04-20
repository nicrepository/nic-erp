package com.niclabs.erp.helpdesk.repository;

import com.niclabs.erp.helpdesk.domain.TicketCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TicketCategoryRepository extends JpaRepository<TicketCategory, UUID> {

    List<TicketCategory> findAllByOrderByNameAsc();

    List<TicketCategory> findByActiveOrderByNameAsc(boolean active);

    boolean existsByNameIgnoreCase(String name);
}
