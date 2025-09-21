package com.example.dockerhub_clone.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "repo_events")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RepoEvent {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private RepoEventType type; // PUSH or PULL

    private String clientIp;

    private Instant occurredAt;

    @ManyToOne @JoinColumn(name = "repository_id")
    private DockerRepository repository;

    @ManyToOne @JoinColumn(name = "tag_id")
    private Tag tag; // nullable

    @ManyToOne @JoinColumn(name = "user_id")
    private User user; // nullable (anonymous pulls)

    @PrePersist
    void prePersist() {
        if (occurredAt == null) occurredAt = Instant.now();
    }
}
