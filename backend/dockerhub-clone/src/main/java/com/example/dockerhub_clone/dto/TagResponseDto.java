package com.example.dockerhub_clone.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TagResponseDto {
    private Long id;
    private String name;
    private String artifactDigest;
    private String repositoryName;
}
