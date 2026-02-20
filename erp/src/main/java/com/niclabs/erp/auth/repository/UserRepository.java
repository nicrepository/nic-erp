package com.niclabs.erp.auth.repository;

import com.niclabs.erp.auth.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    // Esse metodo será vital para o login (Spring Security) no futuro
    Optional<User> findByEmail(String email);
}
