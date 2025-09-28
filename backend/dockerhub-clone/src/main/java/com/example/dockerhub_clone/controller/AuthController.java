package com.example.dockerhub_clone.controller;

import com.example.dockerhub_clone.model.Role;
import com.example.dockerhub_clone.model.RoleName;
import com.example.dockerhub_clone.model.User;
import com.example.dockerhub_clone.model.UserRole;
import com.example.dockerhub_clone.repository.RoleRepository;
import com.example.dockerhub_clone.repository.UserRepository;
import com.example.dockerhub_clone.repository.UserRoleRepository;
import com.example.dockerhub_clone.security.JwtUtil;
import com.example.dockerhub_clone.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final AuditLogService auditLogService;

    @PostMapping("/register")
    public Map<String, String> register(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String email = body.get("email");
        String password = passwordEncoder.encode(body.get("password"));

        User user = User.builder()
                .username(username)
                .displayName(username)
                .email(email)
                .passwordHash(password)
                .active(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        userRepository.save(user);

        Role userRole = roleRepository.findByName(RoleName.ROLE_ADMIN)
                .orElseThrow(() -> new RuntimeException("Default role not found"));

        Role userRole2 = roleRepository.findByName(RoleName.ROLE_USER)
                .orElseThrow(() -> new RuntimeException("Default role not found"));

        userRoleRepository.save(UserRole.builder()
                .user(user)
                .role(userRole)
                .build());
        
        userRoleRepository.save(UserRole.builder()
                .user(user)
                .role(userRole2)
                .build());

        auditLogService.recordAction(user, "USER_REGISTER", "USER", user.getId().toString(), Map.of(
                "email", user.getEmail(),
                "username", user.getUsername()
        ));

        return Map.of("message", "User registered successfully");
    }

    @PostMapping("/login")
    public Map<String, String> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new RuntimeException("Invalid credentials");
        }
        if (!user.isActive()) {
            throw new RuntimeException("Account is deactivated");
        }
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        String token = jwtUtil.generateToken(username);

        auditLogService.recordAction(user, "USER_LOGIN", "USER", user.getId().toString(), Map.of(
                "loginAt", user.getUpdatedAt().toString()
        ));
        return Map.of("token", token);
    }
}
