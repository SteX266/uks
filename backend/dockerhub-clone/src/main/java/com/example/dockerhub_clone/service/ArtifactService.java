package com.example.dockerhub_clone.service;

import com.example.dockerhub_clone.dto.ArtifactRequestDto;
import com.example.dockerhub_clone.dto.ArtifactResponseDto;
import com.example.dockerhub_clone.model.Artifact;
import com.example.dockerhub_clone.model.DockerRepository;
import com.example.dockerhub_clone.model.User;
import com.example.dockerhub_clone.repository.ArtifactRepository;
import com.example.dockerhub_clone.repository.DockerRepositoryRepository;
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
    private final AuthService authService;
    private final AuditLogService auditLogService;

    public ArtifactResponseDto createArtifact(Long repoId, ArtifactRequestDto request) {
        DockerRepository repo = repoRepository.findById(repoId)
                .orElseThrow(() -> new RuntimeException("Repository not found"));

        User actor = authService.getCurrentUser();

        Artifact artifact = Artifact.builder()
                .digest(request.getDigest())
                .size(request.getSize())
                .mediaType(request.getMediaType())
                .createdAt(Instant.now())
                .repository(repo)
                .build();


        Artifact saved = artifactRepository.save(artifact);

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
                .build();
    }
}
