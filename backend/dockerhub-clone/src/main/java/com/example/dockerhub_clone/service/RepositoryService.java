package com.example.dockerhub_clone.service;

import com.example.dockerhub_clone.dto.CreateRepositoryRequestDto;
import com.example.dockerhub_clone.dto.ExploreRepositoryResponseDto;
import com.example.dockerhub_clone.dto.RepositoryResponseDto;
import com.example.dockerhub_clone.model.*;
import com.example.dockerhub_clone.repository.CollaboratorRepository;
import com.example.dockerhub_clone.repository.DockerRepositoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RepositoryService {

    private final DockerRepositoryRepository repoRepository;
    private final CollaboratorRepository collaboratorRepository;
    private final AuthService authService;

    /**
     * Owner creates a new repository.
     */
    public RepositoryResponseDto createRepo(CreateRepositoryRequestDto request) {
        User currentUser = authService.getCurrentUser();

        String name = request.getName() != null ? request.getName().trim() : "";
        if (name.isEmpty()) {
            throw new RuntimeException("Repository name is required");
        }

        DockerRepository repo = DockerRepository.builder()
                .name(name)
                .description(request.getDescription())
                .isPublic(request.isPublic())
                .owner(currentUser)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .isOfficial(false)
                .build();

        return mapToDto(repoRepository.save(repo));
    }

    /**
     * Owner or collaborator with WRITE/ADMIN can edit repository.
     */
    public RepositoryResponseDto editRepo(Long repoId, CreateRepositoryRequestDto request) {
        DockerRepository repo = findRepo(repoId);
        User currentUser = authService.getCurrentUser();

        if (!canWrite(currentUser, repo)) {
            throw new RuntimeException("Not authorized to edit this repository");
        }

        if (request.getName() != null && !request.getName().isBlank()) {
            repo.setName(request.getName().trim());
        }

        repo.setDescription(request.getDescription());
        repo.setPublic(request.isPublic());
        repo.setUpdatedAt(Instant.now());

        return mapToDto(repoRepository.save(repo));
    }

    /**
     * Owner or collaborator with ADMIN can delete repository.
     */
    public void deleteRepo(Long repoId) {
        DockerRepository repo = findRepo(repoId);
        User currentUser = authService.getCurrentUser();

        if (!canAdmin(currentUser, repo)) {
            throw new RuntimeException("Not authorized to delete this repository");
        }

        repoRepository.delete(repo);
    }

    /**
     * Any logged-in user who is owner, collaborator (READ/WRITE/ADMIN),
     * or repo is public can view.
     */
    public RepositoryResponseDto viewRepo(Long repoId) {
        DockerRepository repo = findRepo(repoId);
        User currentUser = authService.getCurrentUser();

        if (repo.isPublic() || canRead(currentUser, repo)) {
            return mapToDto(repo);
        }

        throw new RuntimeException("Not authorized to view this repository");
    }

    /**
     * Owner can mark repo as official (global admin via Role handled separately).
     */
    public RepositoryResponseDto markAsOfficial(Long repoId) {
        DockerRepository repo = findRepo(repoId);
        repo.setOfficial(true);
        repo.setUpdatedAt(Instant.now());
        return mapToDto(repoRepository.save(repo));
    }

    /**
     * List repositories owned by current user.
     */
    public List<RepositoryResponseDto> listMyRepos() {
        return repoRepository.findByOwner(authService.getCurrentUser()).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ExploreRepositoryResponseDto> listPublicRepositoriesForExplore() {
        return repoRepository.findByIsPublicTrueOrderByStarsCountDesc()
                .stream()
                .map(this::mapToExploreDto)
                .collect(Collectors.toList());
    }

    // --- Permission Helpers ---

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

    private boolean canAdmin(User user, DockerRepository repo) {
        return repo.getOwner().equals(user) ||
                collaboratorRepository.findByRepositoryAndUser(repo, user)
                        .map(c -> c.getPermission() == CollaboratorPermission.ADMIN)
                        .orElse(false);
    }

    // --- Utility methods ---

    private DockerRepository findRepo(Long repoId) {
        return repoRepository.findById(repoId)
                .orElseThrow(() -> new RuntimeException("Repository not found"));
    }

    private RepositoryResponseDto mapToDto(DockerRepository repo) {
        return RepositoryResponseDto.builder()
                .id(repo.getId())
                .name(repo.getName())
                .description(repo.getDescription())
                .isPublic(repo.isPublic())
                .isOfficial(repo.isOfficial())
                .ownerUsername(repo.getOwner().getUsername())
                .createdAt(repo.getCreatedAt())
                .updatedAt(repo.getUpdatedAt() != null ? repo.getUpdatedAt() : repo.getCreatedAt())
                .build();
    }

    private ExploreRepositoryResponseDto mapToExploreDto(DockerRepository repo) {
        return ExploreRepositoryResponseDto.builder()
                .id(repo.getId())
                .name(repo.getName())
                .namespace(repo.getOwner() != null ? repo.getOwner().getUsername() : "")
                .description(repo.getDescription())
                .badges(resolveBadges(repo))
                .tags(repo.getTags() == null ? List.of() : repo.getTags().stream()
                        .map(Tag::getName)
                        .collect(Collectors.toList()))
                .stars(repo.getStarsCount() == null ? 0L : repo.getStarsCount())
                .pulls(repo.getPullsCount() == null ? 0L : repo.getPullsCount())
                .updatedAt(repo.getUpdatedAt() != null ? repo.getUpdatedAt() : repo.getCreatedAt())
                .build();
    }

    private List<String> resolveBadges(DockerRepository repo) {
        List<String> badges = new ArrayList<>();

        if (repo.isOfficial()) {
            badges.add(RepositoryBadge.DOCKER_OFFICIAL_IMAGE.getLabel());
        }
        if (repo.isVerifiedPublisher()) {
            badges.add(RepositoryBadge.VERIFIED_PUBLISHER.getLabel());
        }
        if (repo.isSponsoredOss()) {
            badges.add(RepositoryBadge.SPONSORED_OSS.getLabel());
        }

        return badges;
    }
}
