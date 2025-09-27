package com.example.dockerhub_clone.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateAdminRequestDto {
    @NotBlank
    @Size(max = 120)
    private String displayName;

    @NotBlank
    @Size(max = 60)
    private String username;

    @NotBlank
    @Email
    @Size(max = 120)
    private String email;

    @NotBlank
    @Size(min = 8, max = 128)
    private String password;

    @Size(max = 255)
    private String bio;
}