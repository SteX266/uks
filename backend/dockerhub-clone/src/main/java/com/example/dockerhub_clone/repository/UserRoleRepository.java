package com.example.dockerhub_clone.repository;

import com.example.dockerhub_clone.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRoleRepository extends JpaRepository<UserRole, Long> {}
