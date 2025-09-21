package com.example.dockerhub_clone.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "watches", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "repository_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Watch {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Instant createdAt;

    @ManyToOne @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne @JoinColumn(name = "repository_id")
    private DockerRepository repository;
}
