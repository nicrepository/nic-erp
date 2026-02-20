package com.niclabs.erp.inventory.service;

import com.niclabs.erp.auth.domain.User;
import com.niclabs.erp.inventory.domain.InventoryMovement;
import com.niclabs.erp.inventory.domain.MovementType;
import com.niclabs.erp.inventory.domain.StockItem;
import com.niclabs.erp.inventory.dto.StockItemDTO;
import com.niclabs.erp.inventory.repository.InventoryMovementRepository;
import com.niclabs.erp.inventory.repository.StockItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StockItemService {

    private final StockItemRepository itemRepository;
    private final InventoryMovementRepository movementRepository;

    @Transactional
    public StockItem createItem(StockItemDTO dto) {
        StockItem item = new StockItem();
        item.setId(UUID.randomUUID());
        item.setName(dto.name());
        item.setCategory(dto.category());
        item.setQuantity(0); // Todo item novo nasce com estoque zerado
        item.setMinimumStock(dto.minimumStock());

        return itemRepository.save(item);
    }

    @Transactional
    public void addStock(UUID itemId, Integer quantity) {
        StockItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item não encontrado no estoque"));

        item.setQuantity(item.getQuantity() + quantity);
        itemRepository.save(item);

        recordMovement(itemId, quantity, MovementType.IN);
    }

    @Transactional
    public void removeStock(UUID itemId, Integer quantity) {
        StockItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item não encontrado no estoque"));

        if (item.getQuantity() < quantity) {
            throw new RuntimeException("Quantidade insuficiente em estoque!");
        }

        item.setQuantity(item.getQuantity() - quantity);
        itemRepository.save(item);

        recordMovement(itemId, quantity, MovementType.OUT);
    }

    // Método privado para automatizar o registro da auditoria
    private void recordMovement(UUID itemId, Integer quantity, MovementType type) {
        // egamos o usuário que está logado fazendo a requisição!
        User loggedInUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        InventoryMovement movement = new InventoryMovement();
        movement.setId(UUID.randomUUID());
        movement.setItemId(itemId);
        movement.setType(type);
        movement.setQuantity(quantity);
        movement.setPerformedBy(loggedInUser.getId());

        movementRepository.save(movement);
    }
}
