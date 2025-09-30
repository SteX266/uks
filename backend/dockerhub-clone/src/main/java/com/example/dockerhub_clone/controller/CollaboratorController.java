package com.example.dockerhub_clone.controller;

import com.example.dockerhub_clone.dto.AddCollaboratorRequestDto;
import com.example.dockerhub_clone.dto.CollaboratorResponseDto;
import com.example.dockerhub_clone.model.Collaborator;
import com.example.dockerhub_clone.service.CollaboratorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/repositories/{repoId}/collaborators")
@RequiredArgsConstructor
public class CollaboratorController {

    private final CollaboratorService collaboratorService;

    @PreAuthorize("hasAnyRole('USER','ADMIN','SUPER_ADMIN')")
    @PostMapping
    public ResponseEntity<?> addCollaborator(@PathVariable Long repoId,
                                             @RequestBody AddCollaboratorRequestDto request) {
        collaboratorService.addCollaborator(repoId, request);
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("hasAnyRole('USER','ADMIN','SUPER_ADMIN')")
    @DeleteMapping("/{username}")
    public ResponseEntity<?> removeCollaborator(@PathVariable Long repoId,
                                                @PathVariable String username) {
        collaboratorService.removeCollaborator(repoId, username);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAnyRole('USER','ADMIN','SUPER_ADMIN')")
    @GetMapping
    public ResponseEntity<List<CollaboratorResponseDto>> listCollaborators(@PathVariable Long repoId) {
        return ResponseEntity.ok(collaboratorService.listCollaborators(repoId));
    }
}
