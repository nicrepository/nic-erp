package com.niclabs.erp.inventory.service;

import com.niclabs.erp.exception.BusinessException;
import com.niclabs.erp.exception.ResourceNotFoundException;
import com.niclabs.erp.inventory.domain.StockItem;
import com.niclabs.erp.inventory.dto.StockItemDTO;
import com.niclabs.erp.inventory.repository.InventoryMovementRepository;
import com.niclabs.erp.inventory.repository.StockItemRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StockItemServiceTest {

    @Mock StockItemRepository itemRepository;
    @Mock InventoryMovementRepository movementRepository;

    @InjectMocks StockItemService stockItemService;

    private StockItem itemWithQuantity(int qty) {
        StockItem item = new StockItem();
        item.setId(UUID.randomUUID());
        item.setName("Caneta");
        item.setQuantity(qty);
        item.setMinimumStock(5);
        return item;
    }

    private void mockSecurityContext() {
        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(new com.niclabs.erp.auth.domain.User());
        SecurityContext ctx = mock(SecurityContext.class);
        when(ctx.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(ctx);
    }

    @Test
    void addStock_shouldThrow_whenItemNotFound() {
        UUID unknownId = UUID.randomUUID();
        when(itemRepository.findById(unknownId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> stockItemService.addStock(unknownId, 10))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void addStock_shouldIncreaseQuantity() {
        StockItem item = itemWithQuantity(10);
        UUID id = item.getId();

        mockSecurityContext();
        when(itemRepository.findById(id)).thenReturn(Optional.of(item));
        when(itemRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        stockItemService.addStock(id, 5);

        assertThat(item.getQuantity()).isEqualTo(15);
    }

    @Test
    void removeStock_shouldThrow_whenItemNotFound() {
        UUID unknownId = UUID.randomUUID();
        when(itemRepository.findById(unknownId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> stockItemService.removeStock(unknownId, 5))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void removeStock_shouldThrow_whenInsufficientStock() {
        StockItem item = itemWithQuantity(3);

        when(itemRepository.findById(item.getId())).thenReturn(Optional.of(item));

        assertThatThrownBy(() -> stockItemService.removeStock(item.getId(), 10))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("insuficiente");
    }

    @Test
    void removeStock_shouldDecreaseQuantity() {
        StockItem item = itemWithQuantity(20);
        UUID id = item.getId();

        mockSecurityContext();
        when(itemRepository.findById(id)).thenReturn(Optional.of(item));
        when(itemRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        stockItemService.removeStock(id, 7);

        assertThat(item.getQuantity()).isEqualTo(13);
    }
}
