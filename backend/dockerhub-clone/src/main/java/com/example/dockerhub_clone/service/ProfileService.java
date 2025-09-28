package com.example.dockerhub_clone.service;

import com.example.dockerhub_clone.dto.ProfileActivityDto;
import com.example.dockerhub_clone.dto.ProfileBadgeDto;
import com.example.dockerhub_clone.dto.ProfileRepositoryDto;
import com.example.dockerhub_clone.dto.ProfileResponseDto;
import com.example.dockerhub_clone.dto.UpdatePasswordRequestDto;
import com.example.dockerhub_clone.dto.UpdateProfileRequestDto;
import com.example.dockerhub_clone.model.AuditLog;
import com.example.dockerhub_clone.model.DockerRepository;
import com.example.dockerhub_clone.model.User;
import com.example.dockerhub_clone.repository.AuditLogRepository;
import com.example.dockerhub_clone.repository.DockerRepositoryRepository;
import com.example.dockerhub_clone.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private static final Map<String, String> BADGE_DESCRIPTIONS = Map.of(
            "Docker Official Image", "Publishes repositories that are part of the Docker Official Images program.",
            "Verified Publisher", "Publishes repositories under verified organizations.",
            "Sponsored OSS", "Maintains open-source projects backed by sponsorship."
    );

    private final AuthService authService;
    private final DockerRepositoryRepository dockerRepositoryRepository;
    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;
    private final AuditLogService auditLogService;

    public ProfileResponseDto getProfile() {
        User user = authService.getCurrentUser();
        return buildProfileResponse(user);
    }

    public ProfileResponseDto updateProfile(UpdateProfileRequestDto request) {
        User user = authService.getCurrentUser();

        String displayName = Optional.ofNullable(request.getDisplayName()).map(String::trim).orElse("");
        String email = Optional.ofNullable(request.getEmail()).map(String::trim).orElse("");

        if (!StringUtils.hasText(displayName)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Display name is required");
        }
        if (!StringUtils.hasText(email)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }

        String normalizedEmail = email.toLowerCase();
        userRepository.findByEmail(normalizedEmail)
                .filter(existing -> !existing.getId().equals(user.getId()))
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already in use");
                });

        user.setDisplayName(displayName);
        user.setEmail(normalizedEmail);
        user.setBio(StringUtils.hasText(request.getBio()) ? request.getBio().trim() : null);
        user.setAvatarUrl(request.getAvatarUrl());
        user.setUpdatedAt(Instant.now());

        userRepository.save(user);

        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("displayName", user.getDisplayName());
        metadata.put("email", user.getEmail());
        if (StringUtils.hasText(user.getBio())) {
            metadata.put("bioUpdated", true);
        }
        if (StringUtils.hasText(user.getAvatarUrl())) {
            metadata.put("avatarUrl", user.getAvatarUrl());
        }

        auditLogService.recordAction(user, "PROFILE_UPDATE", "USER", user.getId().toString(), metadata);

        return buildProfileResponse(user);
    }

    public void updatePassword(UpdatePasswordRequestDto request) {
        User user = authService.getCurrentUser();

        String currentPassword = Optional.ofNullable(request.getCurrentPassword()).map(String::trim).orElse("");
        String newPassword = Optional.ofNullable(request.getNewPassword()).map(String::trim).orElse("");

        if (!StringUtils.hasText(currentPassword) || !StringUtils.hasText(newPassword)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "All password fields are required");
        }

        if (newPassword.length() < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password must contain at least 8 characters");
        }

        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }

        if (passwordEncoder.matches(newPassword, user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password must be different from the current password");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        auditLogService.recordAction(user, "PASSWORD_CHANGE", "USER", user.getId().toString(), Map.of("passwordChanged", true));
    }

    private ProfileResponseDto buildProfileResponse(User user) {
        List<DockerRepository> ownedRepositories = dockerRepositoryRepository.findByOwner(user);
        long publicCount = dockerRepositoryRepository.countByOwnerAndIsPublicTrue(user);
        long privateCount = dockerRepositoryRepository.countByOwnerAndIsPublicFalse(user);

        List<ProfileRepositoryDto> featuredRepositories = dockerRepositoryRepository
                .findTop3ByOwnerOrderByStarsCountDesc(user)
                .stream()
                .map(repository -> ProfileRepositoryDto.builder()
                        .name(repository.getName())
                        .description(repository.getDescription())
                        .stars(repository.getStarsCount() == null ? 0 : repository.getStarsCount())
                        .updatedAt(repository.getLastPushedAt() != null ? repository.getLastPushedAt() : repository.getUpdatedAt())
                        .build())
                .collect(Collectors.toList());

        List<ProfileBadgeDto> badges = buildBadgeList(ownedRepositories);

        List<ProfileActivityDto> recentActivity = auditLogRepository
                .findTop5ByActorUserOrderByCreatedAtDesc(user)
                .stream()
                .map(this::mapActivity)
                .collect(Collectors.toList());

        Instant lastActive = auditLogRepository.findFirstByActorUserOrderByCreatedAtDesc(user)
                .map(AuditLog::getCreatedAt)
                .orElseGet(() -> user.getUpdatedAt() != null ? user.getUpdatedAt() : user.getCreatedAt());

        String displayName = StringUtils.hasText(user.getDisplayName()) ? user.getDisplayName() : user.getUsername();

        return ProfileResponseDto.builder()
                .displayName(displayName)
                .username(user.getUsername())
                .email(user.getEmail())
                .bio(user.getBio())
                .avatarUrl(user.getAvatarUrl())
                .memberSince(user.getCreatedAt())
                .lastActive(lastActive)
                .repositoriesPublic(publicCount)
                .repositoriesPrivate(privateCount)
                .badges(badges)
                .featuredRepositories(featuredRepositories)
                .recentActivity(recentActivity)
                .build();
    }

    private List<ProfileBadgeDto> buildBadgeList(List<DockerRepository> repositories) {
        Set<String> labels = new LinkedHashSet<>();
        for (DockerRepository repository : repositories) {
            if (repository.isOfficial()) {
                labels.add("Docker Official Image");
            }
            if (repository.isVerifiedPublisher()) {
                labels.add("Verified Publisher");
            }
            if (repository.isSponsoredOss()) {
                labels.add("Sponsored OSS");
            }
        }

        List<ProfileBadgeDto> badges = new ArrayList<>();
        for (String label : labels) {
            badges.add(ProfileBadgeDto.builder()
                    .label(label)
                    .description(BADGE_DESCRIPTIONS.getOrDefault(label, label))
                    .build());
        }
        return badges;
    }

    private ProfileActivityDto mapActivity(AuditLog auditLog) {
        String title = toDisplayCase(auditLog.getAction());
        StringBuilder detailBuilder = new StringBuilder();

        if (StringUtils.hasText(auditLog.getTargetType())) {
            detailBuilder.append(toDisplayCase(auditLog.getTargetType()));
        }
        if (StringUtils.hasText(auditLog.getTargetId())) {
            if (detailBuilder.length() > 0) {
                detailBuilder.append(" #");
            }
            detailBuilder.append(auditLog.getTargetId());
        }

        String metadata = formatMetadata(auditLog.getMetadata());
        if (StringUtils.hasText(metadata)) {
            if (detailBuilder.length() > 0) {
                detailBuilder.append(" — ");
            }
            detailBuilder.append(metadata);
        }

        String detail = detailBuilder.length() > 0 ? detailBuilder.toString() : "Activity recorded";

        return ProfileActivityDto.builder()
                .title(title)
                .detail(detail)
                .occurredAt(auditLog.getCreatedAt())
                .build();
    }

    private String formatMetadata(String metadata) {
        if (!StringUtils.hasText(metadata)) {
            return null;
        }

        try {
            Map<String, Object> values = objectMapper.readValue(metadata, new TypeReference<Map<String, Object>>() {});
            return values.entrySet()
                    .stream()
                    .map(entry -> entry.getKey() + ": " + entry.getValue())
                    .collect(Collectors.joining(", "));
        } catch (JsonProcessingException e) {
            return metadata;
        }
    }

    private String toDisplayCase(String value) {
        if (!StringUtils.hasText(value)) {
            return "";
        }

        String normalized = value.replace('_', ' ').toLowerCase();
        String[] parts = normalized.split(" ");
        List<String> formatted = new ArrayList<>();
        for (String part : parts) {
            if (part.isBlank()) {
                continue;
            }
            formatted.add(Character.toUpperCase(part.charAt(0)) + part.substring(1));
        }
        return String.join(" ", formatted);
    }
}