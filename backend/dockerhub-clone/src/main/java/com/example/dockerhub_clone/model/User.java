package com.example.dockerhub_clone.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users", uniqueConstraints = {
        @UniqueConstraint(columnNames = "username"),
        @UniqueConstraint(columnNames = "email")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false, name = "display_name")
    private String displayName;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false, name = "password_hash")
    private String passwordHash;

    private String bio;
    private String avatarUrl;
    private boolean active = true;

    private Instant createdAt;
    private Instant updatedAt;

    @Builder.Default
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_badges", joinColumns = @JoinColumn(name = "user_id"))
    @Enumerated(EnumType.STRING)
    private Set<UserBadge> badges = new HashSet<>();

    @Builder.Default
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private Set<UserRole> roles = new HashSet<>();



    @PrePersist
    public void prePersist() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;

        if (displayName == null || displayName.isBlank()) {
            displayName = username;
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();

        if (displayName == null || displayName.isBlank()) {
            displayName = username;
        }
    }
}

