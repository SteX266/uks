package com.example.dockerhub_clone.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProfileResponseDto {
    private String displayName;
    private String username;
    private String email;
    private String bio;
    private String avatarUrl;
    private Instant memberSince;
    private Instant lastActive;
    private long repositoriesPublic;
    private long repositoriesPrivate;
    private List<ProfileBadgeDto> badges;
    private List<ProfileRepositoryDto> featuredRepositories;
    private List<ProfileActivityDto> recentActivity;
}