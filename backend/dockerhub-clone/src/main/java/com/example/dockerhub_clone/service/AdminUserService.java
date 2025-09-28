package com.example.dockerhub_clone.service;

import com.example.dockerhub_clone.dto.AdminUserResponseDto;
import com.example.dockerhub_clone.dto.CreateAdminRequestDto;
import com.example.dockerhub_clone.dto.UpdateUserRequestDto;
import com.example.dockerhub_clone.model.Role;
import com.example.dockerhub_clone.model.RoleName;
import com.example.dockerhub_clone.model.User;
import com.example.dockerhub_clone.model.UserBadge;
import com.example.dockerhub_clone.model.UserRole;
import com.example.dockerhub_clone.repository.DockerRepositoryRepository;
import com.example.dockerhub_clone.repository.RoleRepository;
import com.example.dockerhub_clone.repository.UserRepository;
import com.example.dockerhub_clone.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final DockerRepositoryRepository dockerRepositoryRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;
    private final AuthService authService;

    @Transactional
    public AdminUserResponseDto createAdminUser(CreateAdminRequestDto request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new IllegalArgumentException("Username is already in use");
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email is already in use");
        }

        User user = User.builder()
                .username(request.getUsername().trim())
                .displayName(request.getDisplayName().trim())
                .email(request.getEmail().trim())
                .bio(StringUtils.hasText(request.getBio()) ? request.getBio().trim() : null)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .active(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        user = userRepository.save(user);

        Role adminRole = roleRepository.findByName(RoleName.ROLE_ADMIN)
                .orElseThrow(() -> new IllegalStateException("Admin role not configured"));

        UserRole userRole = UserRole.builder()
                .user(user)
                .role(adminRole)
                .build();
        userRoleRepository.save(userRole);
        user.getRoles().add(userRole);

        long repositoryCount = dockerRepositoryRepository.countByOwner(user);
        User actor = authService.getCurrentUser();
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("username", user.getUsername());
        metadata.put("email", user.getEmail());
        metadata.put("displayName", user.getDisplayName());

        auditLogService.recordAction(actor, "ADMIN_USER_CREATE", "USER", user.getId().toString(), metadata);
        return mapToDto(user, repositoryCount);
    }

    @Transactional
    public AdminUserResponseDto updateUser(Long userId, UpdateUserRequestDto request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (StringUtils.hasText(request.getUsername())) {
            String username = request.getUsername().trim();
            if (!username.equalsIgnoreCase(user.getUsername()) && userRepository.findByUsername(username).isPresent()) {
                throw new IllegalArgumentException("Username is already in use");
            }
            user.setUsername(username);
        }

        if (StringUtils.hasText(request.getDisplayName())) {
            user.setDisplayName(request.getDisplayName().trim());
        }

        if (StringUtils.hasText(request.getEmail())) {
            String email = request.getEmail().trim();
            if (!email.equalsIgnoreCase(user.getEmail()) && userRepository.findByEmail(email).isPresent()) {
                throw new IllegalArgumentException("Email is already in use");
            }
            user.setEmail(email);
        }

        if (request.getBio() != null) {
            user.setBio(StringUtils.hasText(request.getBio()) ? request.getBio().trim() : null);
        }

        if (request.getActive() != null) {
            user.setActive(request.getActive());
        }

        if (request.getBadges() != null) {
            Set<UserBadge> badges = request.getBadges().stream()
                    .filter(StringUtils::hasText)
                    .map(String::trim)
                    .map(UserBadge::fromLabel)
                    .collect(Collectors.toCollection(() -> EnumSet.noneOf(UserBadge.class)));
            user.setBadges(badges);
        }

        user.setUpdatedAt(Instant.now());
        user = userRepository.save(user);

        long repositoryCount = dockerRepositoryRepository.countByOwner(user);
        User actor = authService.getCurrentUser();
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("username", user.getUsername());
        metadata.put("email", user.getEmail());
        metadata.put("active", user.isActive());
        metadata.put("badges", user.getBadges().stream().map(UserBadge::getLabel).toList());

        auditLogService.recordAction(actor, "ADMIN_USER_UPDATE", "USER", user.getId().toString(), metadata);
        return mapToDto(user, repositoryCount);
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        User actor = authService.getCurrentUser();
        Map<String, Object> metadata = Map.of(
                "username", user.getUsername(),
                "email", user.getEmail()
        );
        auditLogService.recordAction(actor, "ADMIN_USER_DELETE", "USER", user.getId().toString(), metadata);
        userRepository.delete(user);
    }

    @Transactional(readOnly = true)
    public List<AdminUserResponseDto> getAllUsers() {
        return userRepository.findAll().stream()
                .sorted(Comparator.comparing(User::getUsername, String.CASE_INSENSITIVE_ORDER))
                .map(user -> mapToDto(user, dockerRepositoryRepository.countByOwner(user)))
                .toList();
    }

    private AdminUserResponseDto mapToDto(User user, long repositoryCount) {
        Set<String> badges = user.getBadges().stream()
                .map(UserBadge::getLabel)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        Set<String> roles = user.getRoles().stream()
                .map(UserRole::getRole)
                .map(Role::getName)
                .map(this::formatRole)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        return AdminUserResponseDto.builder()
                .id(user.getId())
                .displayName(user.getDisplayName())
                .username(user.getUsername())
                .email(user.getEmail())
                .bio(user.getBio())
                .active(user.isActive())
                .avatarUrl(user.getAvatarUrl())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .repositoryCount(repositoryCount)
                .badges(badges)
                .roles(roles)
                .build();
    }

    private String formatRole(RoleName roleName) {
        return switch (roleName) {
            case ROLE_ADMIN -> "Admin";
            case ROLE_SUPER_ADMIN -> "Super Admin";
            case ROLE_USER -> "User";
        };
    }
}