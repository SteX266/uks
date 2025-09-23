package com.example.dockerhub_clone.controller;

import com.example.dockerhub_clone.dto.CreateRepositoryRequestDto;
import com.example.dockerhub_clone.dto.RepositoryResponseDto;
import com.example.dockerhub_clone.service.RepositoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/repositories")
@RequiredArgsConstructor
public class RepositoryController {

    private final RepositoryService repositoryService;

    @PreAuthorize("hasRole('USER')")
    @PostMapping
    public ResponseEntity<RepositoryResponseDto> createRepo(@RequestBody CreateRepositoryRequestDto request) {
        return ResponseEntity.ok(repositoryService.createRepo(request));
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/me")
    public ResponseEntity<List<RepositoryResponseDto>> listMyRepos() {
        return ResponseEntity.ok(repositoryService.listMyRepos());
    }

    @PreAuthorize("hasRole('USER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRepo(@PathVariable Long id) {
        repositoryService.deleteRepo(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('USER')")
    @PutMapping("/{id}")
    public ResponseEntity<RepositoryResponseDto> editRepo(
            @PathVariable Long id,
            @RequestBody CreateRepositoryRequestDto request) {
        return ResponseEntity.ok(repositoryService.editRepo(id, request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{id}/make-official")
    public ResponseEntity<RepositoryResponseDto> makeOfficial(@PathVariable Long id) {
        return ResponseEntity.ok(repositoryService.markAsOfficial(id));
    }


}
