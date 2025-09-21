package com.example.dockerhub_clone.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String action;        // e.g., "REPO_CREATE", "TAG_DELETE"
    private String targetType;    // e.g., "REPOSITORY", "TAG", "USER"
    private String targetId;      // store the id as string for flexibility

    @Column(length = 4000)
    private String metadata;      // optional JSON/details

    private Instant createdAt;

    @ManyToOne @JoinColumn(name = "actor_user_id")
    private User actorUser;       // who did it

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
    }
}
