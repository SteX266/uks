package com.example.dockerhub_clone.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ExploreRepositoryResponseDto {
    private Long id;
    private String name;
    private String namespace;
    private String description;
    private List<String> badges;
    private List<String> tags;
    private Long stars;
    private Long pulls;
    private Instant updatedAt;
}