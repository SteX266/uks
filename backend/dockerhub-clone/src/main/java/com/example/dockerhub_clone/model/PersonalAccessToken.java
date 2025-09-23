package com.example.dockerhub_clone.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "personal_access_tokens", uniqueConstraints = {
        @UniqueConstraint(columnNames = "tokenHash")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PersonalAccessToken {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String tokenHash; // store only a hash

    @Column(length = 2000)
    private String scopes; // CSV or JSON string (e.g., "read,write")

    private Instant expiresAt;
    private Instant createdAt;

    @ManyToOne @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
    }
}
