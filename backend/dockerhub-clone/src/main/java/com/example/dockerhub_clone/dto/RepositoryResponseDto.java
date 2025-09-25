package com.example.dockerhub_clone.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RepositoryResponseDto {
    private Long id;
    private String name;
    private String description;
    private boolean isPublic;
    private boolean isOfficial;
    private String ownerUsername;
    private Instant createdAt;
}
