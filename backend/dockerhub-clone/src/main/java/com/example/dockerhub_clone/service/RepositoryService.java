package com.example.dockerhub_clone.service;

import com.example.dockerhub_clone.dto.CreateRepositoryRequestDto;
import com.example.dockerhub_clone.dto.RepositoryResponseDto;
import com.example.dockerhub_clone.model.DockerRepository;
import com.example.dockerhub_clone.model.User;
import com.example.dockerhub_clone.repository.DockerRepositoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RepositoryService {

    private final DockerRepositoryRepository repoRepository;
    private final AuthService authService;

    public RepositoryResponseDto createRepo(CreateRepositoryRequestDto request) {
        User currentUser = authService.getCurrentUser();

        DockerRepository repo = DockerRepository.builder()
                .name(request.getName())
                .description(request.getDescription())
                .isPublic(request.isPublic())
                .owner(currentUser)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        DockerRepository saved = repoRepository.save(repo);
        return mapToDto(saved);
    }

    public List<RepositoryResponseDto> listMyRepos() {
        return repoRepository.findByOwner(authService.getCurrentUser()).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public void deleteRepo(Long repoId) {
        DockerRepository repo = repoRepository.findById(repoId)
                .orElseThrow(() -> new RuntimeException("Repository not found"));

        if (!repo.getOwner().equals(authService.getCurrentUser())) {
            throw new RuntimeException("Not authorized to delete this repository");
        }

        repoRepository.delete(repo);
    }

    private RepositoryResponseDto mapToDto(DockerRepository repo) {
        return RepositoryResponseDto.builder()
                .id(repo.getId())
                .name(repo.getName())
                .description(repo.getDescription())
                .isPublic(repo.isPublic())
                .ownerUsername(repo.getOwner().getUsername())
                .createdAt(repo.getCreatedAt())
                .build();
    }

    public RepositoryResponseDto editRepo(Long repoId, CreateRepositoryRequestDto request) {
        DockerRepository repo = repoRepository.findById(repoId)
                .orElseThrow(() -> new RuntimeException("Repository not found"));

        if (!repo.getOwner().equals(authService.getCurrentUser())) {
            throw new RuntimeException("Not authorized to edit this repository");
        }

        repo.setDescription(request.getDescription());
        repo.setPublic(request.isPublic());
        repo.setUpdatedAt(Instant.now());

        return mapToDto(repoRepository.save(repo));
    }

    public RepositoryResponseDto markAsOfficial(Long repoId) {
        DockerRepository repo = repoRepository.findById(repoId)
                .orElseThrow(() -> new RuntimeException("Repository not found"));

        repo.setOfficial(true);
        repo.setUpdatedAt(Instant.now());

        return mapToDto(repoRepository.save(repo));
    }

}
