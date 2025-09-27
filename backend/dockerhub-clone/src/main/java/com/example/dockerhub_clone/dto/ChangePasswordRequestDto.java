package com.example.dockerhub_clone.dto;

import lombok.Value;

@Value
public class ChangePasswordRequestDto {
    String currentPassword;
    String newPassword;
}