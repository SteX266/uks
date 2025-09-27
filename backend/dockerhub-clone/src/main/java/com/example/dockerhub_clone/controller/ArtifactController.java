package com.example.dockerhub_clone.controller;

import com.example.dockerhub_clone.dto.ArtifactRequestDto;
import com.example.dockerhub_clone.dto.ArtifactResponseDto;
import com.example.dockerhub_clone.service.ArtifactService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/repositories/{repoId}/artifacts")
@RequiredArgsConstructor
public class ArtifactController {

    private final ArtifactService artifactService;

    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    @PostMapping
    public ResponseEntity<ArtifactResponseDto> createArtifact(
            @PathVariable Long repoId,
            @RequestBody ArtifactRequestDto request
    ) {
        return ResponseEntity.ok(artifactService.createArtifact(repoId, request));
    }

    @GetMapping
    public ResponseEntity<List<ArtifactResponseDto>> listArtifacts(@PathVariable Long repoId) {
        return ResponseEntity.ok(artifactService.listArtifacts(repoId));
    }
}
