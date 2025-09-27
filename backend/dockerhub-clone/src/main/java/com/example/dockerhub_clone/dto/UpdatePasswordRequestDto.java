package com.example.dockerhub_clone.dto;

import lombok.Data;

@Data
public class UpdatePasswordRequestDto {
    private String currentPassword;
    private String newPassword;
}