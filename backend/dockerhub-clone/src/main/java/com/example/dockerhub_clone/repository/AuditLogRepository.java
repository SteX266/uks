package com.example.dockerhub_clone.repository;

import com.example.dockerhub_clone.model.AuditLog;
import com.example.dockerhub_clone.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByActorUser(User user);
}
