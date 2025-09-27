package com.example.dockerhub_clone.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserResponseDto {
    private Long id;
    private String displayName;
    private String username;
    private String email;
    private String bio;
    private boolean active;
    private String avatarUrl;
    private Instant createdAt;
    private Instant updatedAt;
    private long repositoryCount;
    private Set<String> badges;
    private Set<String> roles;
}