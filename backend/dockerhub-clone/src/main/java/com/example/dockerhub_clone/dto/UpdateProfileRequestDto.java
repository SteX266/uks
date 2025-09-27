package com.example.dockerhub_clone.dto;

import lombok.Data;

@Data
public class UpdateProfileRequestDto {
    private String displayName;
    private String email;
    private String bio;
    private String avatarUrl;
}