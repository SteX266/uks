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
@RequestMapping("/api/admin/repositories")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
public class AdminRepositoryController {

    private final RepositoryService repositoryService;

    @GetMapping("/official")
    public ResponseEntity<List<RepositoryResponseDto>> listOfficialRepositories() {
        return ResponseEntity.ok(repositoryService.listOfficialRepositories());
    }

    @PostMapping("/official")
    public ResponseEntity<RepositoryResponseDto> createOfficialRepository(@RequestBody CreateRepositoryRequestDto request) {
        return ResponseEntity.ok(repositoryService.createOfficialRepository(request));
    }

    @PutMapping("/official/{id}")
    public ResponseEntity<RepositoryResponseDto> updateOfficialRepository(
            @PathVariable Long id,
            @RequestBody CreateRepositoryRequestDto request) {
        return ResponseEntity.ok(repositoryService.updateOfficialRepository(id, request));
    }

    @DeleteMapping("/official/{id}")
    public ResponseEntity<Void> deleteOfficialRepository(@PathVariable Long id) {
        repositoryService.deleteOfficialRepository(id);
        return ResponseEntity.noContent().build();
    }
}
