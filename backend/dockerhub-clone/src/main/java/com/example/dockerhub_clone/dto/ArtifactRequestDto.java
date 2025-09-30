package com.example.dockerhub_clone.dto;

import lombok.Data;

@Data
public class ArtifactRequestDto {
    private String digest;
    private Long size;
    private String mediaType;
}
