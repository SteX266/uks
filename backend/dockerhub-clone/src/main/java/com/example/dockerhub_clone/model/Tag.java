package com.example.dockerhub_clone.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "tags", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"repository_id", "name"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tag {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private Instant createdAt;
    private Instant updatedAt;

    @ManyToOne @JoinColumn(name = "repository_id")
    private DockerRepository repository;

    @ManyToOne @JoinColumn(name = "artifact_id")
    private Artifact artifact;
}
