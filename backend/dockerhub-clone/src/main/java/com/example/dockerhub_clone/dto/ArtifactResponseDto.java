package com.example.dockerhub_clone.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ArtifactResponseDto {
    private Long id;
    private String digest;
    private Long size;
    private String mediaType;
    private String repositoryName;
}
