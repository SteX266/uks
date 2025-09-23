package com.example.dockerhub_clone.controller;

import com.example.dockerhub_clone.model.Role;
import com.example.dockerhub_clone.model.RoleName;
import com.example.dockerhub_clone.model.User;
import com.example.dockerhub_clone.model.UserRole;
import com.example.dockerhub_clone.repository.RoleRepository;
import com.example.dockerhub_clone.repository.UserRepository;
import com.example.dockerhub_clone.repository.UserRoleRepository;
import com.example.dockerhub_clone.security.JwtUtil;
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

    @PostMapping("/register")
    public Map<String, String> register(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String email = body.get("email");
        String password = passwordEncoder.encode(body.get("password"));

        User user = User.builder()
                .username(username)
                .email(email)
                .passwordHash(password)
                .active(true)
                .createdAt(Instant.now())
                .build();

        userRepository.save(user);

        Role userRole = roleRepository.findByName(RoleName.ROLE_USER)
                .orElseThrow(() -> new RuntimeException("Default role not found"));

        userRoleRepository.save(UserRole.builder()
                .user(user)
                .role(userRole)
                .build());

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

        String token = jwtUtil.generateToken(username);
        return Map.of("token", token);
    }
}
