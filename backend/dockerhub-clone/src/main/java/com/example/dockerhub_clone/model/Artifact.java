package com.example.dockerhub_clone.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.Set;

@Entity
@Table(name = "artifacts", uniqueConstraints = {
        @UniqueConstraint(columnNames = "digest")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Artifact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String digest;

    private Long size;
    private String mediaType;
    private Instant createdAt;

    @ManyToOne(optional = false)
    @JoinColumn(name = "repository_id")
    private DockerRepository repository;

    @OneToMany(mappedBy = "artifact", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Tag> tags;
}
