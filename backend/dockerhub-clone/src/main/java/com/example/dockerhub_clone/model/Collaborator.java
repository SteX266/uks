package com.example.dockerhub_clone.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "collaborators", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"repository_id", "user_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Collaborator {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private RepoPermission permission;

    @ManyToOne @JoinColumn(name = "repository_id")
    private DockerRepository repository;

    @ManyToOne @JoinColumn(name = "user_id")
    private User user;
}
