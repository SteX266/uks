package com.example.dockerhub_clone.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class CreateRepositoryRequestDto {
    private String name;
    private String description;
    @JsonProperty("isPublic")
    private boolean isPublic;
}
