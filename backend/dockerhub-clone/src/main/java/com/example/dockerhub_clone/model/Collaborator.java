package com.example.dockerhub_clone.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "collaborators", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"repository_id", "user_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Collaborator {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "repository_id")
    private DockerRepository repository;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CollaboratorPermission permission;
}
