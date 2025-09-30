package com.example.dockerhub_clone.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.Set;

@Data
public class UpdateUserRequestDto {
    @Size(max = 120)
    private String displayName;

    @Size(max = 60)
    private String username;

    @Email
    @Size(max = 120)
    private String email;

    @Size(max = 255)
    private String bio;

    private Boolean active;

    private Set<String> badges;
}