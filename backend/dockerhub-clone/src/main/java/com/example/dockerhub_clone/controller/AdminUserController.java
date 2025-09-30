package com.example.dockerhub_clone.controller;

import com.example.dockerhub_clone.dto.AdminUserResponseDto;
import com.example.dockerhub_clone.dto.CreateAdminRequestDto;
import com.example.dockerhub_clone.dto.UpdateUserRequestDto;
import com.example.dockerhub_clone.service.AdminUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public List<AdminUserResponseDto> getUsers() {
        return adminUserService.getAllUsers();
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<AdminUserResponseDto> createAdmin(@Valid @RequestBody CreateAdminRequestDto request) {
        AdminUserResponseDto response = adminUserService.createAdminUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public AdminUserResponseDto updateUser(
            @PathVariable Long userId,
            @Valid @RequestBody UpdateUserRequestDto request
    ) {
        return adminUserService.updateUser(userId, request);
    }

    @DeleteMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<AdminUserResponseDto> deleteUser(@PathVariable Long userId) {
        AdminUserResponseDto response = adminUserService.deleteUser(userId);
        return ResponseEntity.ok(response);
    }
}