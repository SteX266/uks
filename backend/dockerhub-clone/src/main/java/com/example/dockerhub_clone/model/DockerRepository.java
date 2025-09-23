package com.example.dockerhub_clone.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "repositories", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"owner_id", "name"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DockerRepository {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;
    private boolean isPublic;
    @Column(nullable = false)
    private boolean isOfficial = false;

    private Long starsCount = 0L;
    private Long pullsCount = 0L;
    private Instant lastPushedAt;
    private Instant createdAt;
    private Instant updatedAt;

    @ManyToOne @JoinColumn(name = "owner_id")
    private User owner;

    @OneToMany(mappedBy = "repository", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Tag> tags;
}
