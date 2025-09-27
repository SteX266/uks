package com.example.dockerhub_clone.repository;

import com.example.dockerhub_clone.model.AuditLog;
import com.example.dockerhub_clone.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByActorUser(User user);
    List<AuditLog> findTop5ByActorUserOrderByCreatedAtDesc(User user);
    Optional<AuditLog> findFirstByActorUserOrderByCreatedAtDesc(User user);
}