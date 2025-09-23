package com.example.dockerhub_clone.dto;

import lombok.Data;

@Data
public class CreateRepositoryRequestDto {
    private String name;
    private String description;
    private boolean isPublic;
}
