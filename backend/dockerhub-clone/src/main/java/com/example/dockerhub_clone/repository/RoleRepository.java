package com.example.dockerhub_clone.repository;

import com.example.dockerhub_clone.model.Role;
import com.example.dockerhub_clone.model.RoleName;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(RoleName name);
}
