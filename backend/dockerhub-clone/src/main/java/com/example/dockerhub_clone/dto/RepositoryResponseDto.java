package com.example.dockerhub_clone.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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
    @JsonProperty("isPublic")
    private boolean isPublic;
    @JsonProperty("isOfficial")
    private boolean isOfficial;
    private String ownerUsername;
    private Instant createdAt;
    private Instant updatedAt;
    @JsonProperty("isVerifiedPublisher")
    private boolean isVerifiedPublisher;
    @JsonProperty("isSponsoredOss")
    private boolean isSponsoredOss;
}
