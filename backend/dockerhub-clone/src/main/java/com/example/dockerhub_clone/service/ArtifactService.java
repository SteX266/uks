package com.example.dockerhub_clone.service;

import com.example.dockerhub_clone.dto.ArtifactRequestDto;
import com.example.dockerhub_clone.dto.ArtifactResponseDto;
import com.example.dockerhub_clone.model.Artifact;
import com.example.dockerhub_clone.model.DockerRepository;
import com.example.dockerhub_clone.repository.ArtifactRepository;
import com.example.dockerhub_clone.repository.DockerRepositoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ArtifactService {

    private final ArtifactRepository artifactRepository;
    private final DockerRepositoryRepository repoRepository;
    private final AuthService authService;

    public ArtifactResponseDto createArtifact(Long repoId, ArtifactRequestDto request) {
        DockerRepository repo = repoRepository.findById(repoId)
                .orElseThrow(() -> new RuntimeException("Repository not found"));

        // TODO: enforce permissions (WRITE/ADMIN)

        Artifact artifact = Artifact.builder()
                .digest(request.getDigest())
                .size(request.getSize())
                .mediaType(request.getMediaType())
                .createdAt(Instant.now())
                .repository(repo)
                .build();

        return mapToDto(artifactRepository.save(artifact));
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
