package com.example.dockerhub_clone.service;

import com.example.dockerhub_clone.dto.ArtifactRequestDto;
import com.example.dockerhub_clone.dto.ArtifactResponseDto;
import com.example.dockerhub_clone.model.Artifact;
import com.example.dockerhub_clone.model.CollaboratorPermission;
import com.example.dockerhub_clone.model.DockerRepository;
import com.example.dockerhub_clone.model.User;
import com.example.dockerhub_clone.repository.ArtifactRepository;
import com.example.dockerhub_clone.repository.DockerRepositoryRepository;
import com.example.dockerhub_clone.repository.CollaboratorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ArtifactService {

    private final ArtifactRepository artifactRepository;
    private final DockerRepositoryRepository repoRepository;
    private final CollaboratorRepository collaboratorRepository;
    private final AuthService authService;
    private final AuditLogService auditLogService;

    public ArtifactResponseDto createArtifact(Long repoId, ArtifactRequestDto request) {
        DockerRepository repo = repoRepository.findById(repoId)
                .orElseThrow(() -> new RuntimeException("Repository not found"));

        User actor = authService.getCurrentUser();

        if (!canWrite(actor, repo)) {
            throw new RuntimeException("Not authorized");
        }

        Artifact artifact = Artifact.builder()
                .digest(request.getDigest())
                .size(request.getSize())
                .mediaType(request.getMediaType())
                .createdAt(Instant.now())
                .repository(repo)
                .build();


        Artifact saved = artifactRepository.save(artifact);

        Instant now = Instant.now();
        repo.setLastPushedAt(now);
        repo.setUpdatedAt(now);
        repoRepository.save(repo);

        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("repository", repo.getName());
        metadata.put("digest", saved.getDigest());
        metadata.put("size", saved.getSize());
        metadata.put("mediaType", saved.getMediaType());

        auditLogService.recordAction(actor, "ARTIFACT_CREATE", "ARTIFACT", saved.getId().toString(), metadata);

        return mapToDto(saved);
    }

    public List<ArtifactResponseDto> listArtifacts(Long repoId) {
        DockerRepository repo = repoRepository.findById(repoId)
                .orElseThrow(() -> new RuntimeException("Repository not found"));

        User actor = authService.getCurrentUser();

        if (!(repo.isPublic() || canRead(actor, repo))) {
            throw new RuntimeException("Not authorized");
        }

        return artifactRepository.findByRepository(repo).stream()
                .map(this::mapToDto)
                .toList();
    }

    private ArtifactResponseDto mapToDto(Artifact artifact) {
        return ArtifactResponseDto.builder()
                .id(artifact.getId())
                .digest(artifact.getDigest())
                .size(artifact.getSize())
                .mediaType(artifact.getMediaType())
                .repositoryName(artifact.getRepository().getName())
                .createdAt(artifact.getCreatedAt())
                .build();
    }

    private boolean canRead(User user, DockerRepository repo) {
        return repo.getOwner().equals(user) ||
                collaboratorRepository.findByRepositoryAndUser(repo, user)
                        .map(c -> c.getPermission() == CollaboratorPermission.READ
                                || c.getPermission() == CollaboratorPermission.WRITE
                                || c.getPermission() == CollaboratorPermission.ADMIN)
                        .orElse(false);
    }

    private boolean canWrite(User user, DockerRepository repo) {
        return repo.getOwner().equals(user) ||
                collaboratorRepository.findByRepositoryAndUser(repo, user)
                        .map(c -> c.getPermission() == CollaboratorPermission.WRITE
                                || c.getPermission() == CollaboratorPermission.ADMIN)
                        .orElse(false);
    }
}