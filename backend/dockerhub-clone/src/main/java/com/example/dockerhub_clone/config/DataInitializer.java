package com.example.dockerhub_clone.config;

import com.example.dockerhub_clone.model.Role;
import com.example.dockerhub_clone.model.RoleName;
import com.example.dockerhub_clone.model.User;
import com.example.dockerhub_clone.model.UserRole;
import com.example.dockerhub_clone.repository.RoleRepository;
import com.example.dockerhub_clone.repository.UserRepository;
import com.example.dockerhub_clone.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Locale;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private static final String SUPER_ADMIN_USERNAME = "superadmin";
    private static final String SUPER_ADMIN_EMAIL = "superadmin@system.local";
    private static final int SUPER_ADMIN_PASSWORD_LENGTH = 24;
    private static final String PASSWORD_FILE_NAME = "super-admin-initial-password.txt";

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        ensureRoles();
        ensureSuperAdmin();
    }

    private void ensureRoles() {
        for (RoleName rn : RoleName.values()) {
            roleRepository.findByName(rn)
                    .orElseGet(() -> roleRepository.save(Role.builder().name(rn).build()));
        }
    }

    private void ensureSuperAdmin() {
        if (userRepository.findByUsername(SUPER_ADMIN_USERNAME).isPresent()) {
            return;
        }

        Role superAdminRole = roleRepository.findByName(RoleName.ROLE_SUPER_ADMIN)
                .orElseThrow(() -> new IllegalStateException("Super admin role not configured"));

        String rawPassword = generateSecurePassword();
        User superAdmin = User.builder()
                .username(SUPER_ADMIN_USERNAME)
                .displayName("Super Administrator")
                .email(SUPER_ADMIN_EMAIL)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .passwordChangeRequired(true)
                .active(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        superAdmin = userRepository.save(superAdmin);

        UserRole link = UserRole.builder()
                .user(superAdmin)
                .role(superAdminRole)
                .build();
        userRoleRepository.save(link);
        superAdmin.getRoles().add(link);

        writePasswordToFile(rawPassword);
        log.info("Super admin account created. Initial password written to {}", resolvePasswordFilePath());
    }

    private String generateSecurePassword() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[SUPER_ADMIN_PASSWORD_LENGTH];
        random.nextBytes(bytes);
        String hex = HexFormat.of().formatHex(bytes).toUpperCase(Locale.ROOT);
        return hex.substring(0, SUPER_ADMIN_PASSWORD_LENGTH);
    }

    private void writePasswordToFile(String password) {
        Path path = resolvePasswordFilePath();
        try {
            Path parent = path.getParent();
            if (parent != null) {
                Files.createDirectories(parent);
            }
            Files.writeString(
                    path,
                    password,
                    StandardCharsets.UTF_8,
                    StandardOpenOption.CREATE,
                    StandardOpenOption.TRUNCATE_EXISTING,
                    StandardOpenOption.WRITE
            );
        } catch (IOException e) {
            throw new IllegalStateException("Failed to write super admin password to file", e);
        }
    }

    private Path resolvePasswordFilePath() {
        return Path.of(System.getProperty("user.dir")).resolve(PASSWORD_FILE_NAME).toAbsolutePath();
    }
}