package com.example.dockerhub_clone.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ChangePasswordRequestDto {
    @NotBlank
    private String username;

    @NotBlank
    private String currentPassword;

    @NotBlank
    private String newPassword;
}