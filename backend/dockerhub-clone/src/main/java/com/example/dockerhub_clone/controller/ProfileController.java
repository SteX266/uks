package com.example.dockerhub_clone.controller;

import com.example.dockerhub_clone.dto.ProfileResponseDto;
import com.example.dockerhub_clone.dto.UpdatePasswordRequestDto;
import com.example.dockerhub_clone.dto.UpdateProfileRequestDto;
import com.example.dockerhub_clone.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping
    public ProfileResponseDto getProfile() {
        return profileService.getProfile();
    }

    @PutMapping
    public ProfileResponseDto updateProfile(@RequestBody UpdateProfileRequestDto request) {
        return profileService.updateProfile(request);
    }

    @PutMapping("/password")
    public Map<String, String> updatePassword(@RequestBody UpdatePasswordRequestDto request) {
        profileService.updatePassword(request);
        return Map.of("message", "Password updated successfully");
    }
}