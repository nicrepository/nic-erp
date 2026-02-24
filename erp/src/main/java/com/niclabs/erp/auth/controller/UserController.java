package com.niclabs.erp.auth.controller;

import com.niclabs.erp.auth.dto.UserResponseDTO;
import com.niclabs.erp.auth.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')") // Só Admin pode ver a lista completa
    public ResponseEntity<List<UserResponseDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.listAllUsers());
    }

    @PutMapping("/{id}/role")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')") // Só Admin pode promover alguém
    public ResponseEntity<UserResponseDTO> updateRole(
            @PathVariable UUID id,
            @RequestParam String roleName) { // Ex: ?roleName=ROLE_TI

        return ResponseEntity.ok(userService.updateUserRole(id, roleName));
    }

    // ROTA TEMPORÁRIA PARA DEBUG
    @GetMapping("/me")
    public ResponseEntity<?> whoAmI() {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(auth.getAuthorities());
    }
}
