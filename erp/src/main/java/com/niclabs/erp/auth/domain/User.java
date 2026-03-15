package com.niclabs.erp.auth.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "users", schema = "auth")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User implements UserDetails {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "avatar_url")
    private String avatarUrl;

    private Boolean active;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "user_roles",
            schema = "auth",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles;

    // --- MÉTODOS OBRIGATÓRIOS DO SPRING SECURITY (USERDETAILS) ---

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Prevenção contra erro caso o usuário não tenha nenhuma role ainda
        if (this.roles == null || this.roles.isEmpty()) {
            return List.of();
        }

        // Usamos um Set para evitar permissões duplicadas (caso 2 cargos tenham a mesma permissão)
        Set<GrantedAuthority> authorities = new java.util.HashSet<>();

        for (Role role : this.roles) {
            // 1. Adiciona o próprio cargo (Ex: "ROLE_TI")
            authorities.add(new SimpleGrantedAuthority(role.getName()));

            // 2. Adiciona as Permissões dinâmicas amarradas a este cargo (Ex: "ACCESS_INVENTORY")
            if (role.getPermissions() != null) {
                for (Permission permission : role.getPermissions()) {
                    authorities.add(new SimpleGrantedAuthority(permission.getName()));
                }
            }
        }

        return authorities;
    }

    @Override
    public String getUsername() {
        return this.email; // O nosso "username" de login será o e-mail
    }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return this.active; }
}