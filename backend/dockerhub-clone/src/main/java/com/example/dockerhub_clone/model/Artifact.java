package com.example.dockerhub_clone.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "artifacts", uniqueConstraints = {
        @UniqueConstraint(columnNames = "digest")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Artifact {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String digest;

    private String mediaType;
    private Long sizeBytes;
    private Instant createdAt;

    @ManyToOne @JoinColumn(name = "repository_id")
    private DockerRepository repository;
}
