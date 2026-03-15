package com.niclabs.erp.auth.controller;

import com.niclabs.erp.auth.dto.UpdateUserAdminDTO;
import com.niclabs.erp.auth.dto.UserResponseDTO;
import com.niclabs.erp.auth.dto.ChangePasswordDTO;
import com.niclabs.erp.auth.service.UserService;
import com.niclabs.erp.storage.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final StorageService storageService;

    @GetMapping
    @PreAuthorize("hasAuthority('ACCESS_USERS') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<UserResponseDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.listAllUsers());
    }

    @PutMapping("/{id}/roles")
    @PreAuthorize("hasAuthority('ACCESS_USERS') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<UserResponseDTO> updateRoles(
            @PathVariable UUID id,
            @RequestBody List<String> roleNames) {

        return ResponseEntity.ok(userService.updateUserRoles(id, roleNames));
    }

    // --- NOVA ROTA DE UPLOAD DE AVATAR ---
    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserResponseDTO> uploadAvatar(
            @RequestParam("file") MultipartFile file,
            Principal principal) {

        // 1. Salva o arquivo fisicamente usando o seu StorageService
        String fileName = storageService.store(file);

        // 2. Monta a URL que o React vai usar para exibir a imagem
        String fileUrl = "/files/" + fileName;

        // 3. Atualiza o banco de dados usando o e-mail do usuário logado
        UserResponseDTO updatedUser = userService.updateAvatar(principal.getName(), fileUrl);

        return ResponseEntity.ok(updatedUser);
    }

    // ROTA TEMPORÁRIA PARA DEBUG
    @GetMapping("/me")
    public ResponseEntity<?> whoAmI() {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(auth.getAuthorities());
    }

    @PutMapping("/me/password")
    public ResponseEntity<String> changePassword(
            @RequestBody ChangePasswordDTO dto,
            Principal principal) {
        try {
            userService.changePassword(principal.getName(), dto);
            return ResponseEntity.ok("Senha alterada com sucesso!");
        } catch (RuntimeException e) {
            // Se a senha atual estiver errada, devolvemos um erro 400 com a mensagem
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ACCESS_USERS') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> updateUserDetails( // <-- Mudamos para <?> para poder retornar String de erro ou o DTO de sucesso
                                                @PathVariable UUID id,
                                                @RequestBody UpdateUserAdminDTO dto) {

        try {
            // Se der certo, devolve 200 OK com os dados novos
            UserResponseDTO updatedUser = userService.updateUserDetailsByAdmin(id, dto);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            // Se der erro de negócio, devolve 400 Bad Request com a mensagem real
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}