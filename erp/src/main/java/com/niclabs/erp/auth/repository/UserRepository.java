package com.niclabs.erp.auth.repository;

import com.niclabs.erp.auth.domain.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    // Esse metodo será vital para o login (Spring Security) no futuro
    Optional<User> findByEmail(String email);

    @Query("""
            select distinct u
            from User u
            left join u.roles r
            where lower(u.name) like lower(concat('%', :search, '%'))
               or lower(u.email) like lower(concat('%', :search, '%'))
               or lower(r.name) like lower(concat('%', :search, '%'))
            """)
    Page<User> searchUsers(@Param("search") String search, Pageable pageable);
}
