package com.example.dockerhub_clone.service;

import com.example.dockerhub_clone.dto.TagRequestDto;
import com.example.dockerhub_clone.dto.TagResponseDto;
import com.example.dockerhub_clone.model.Artifact;
import com.example.dockerhub_clone.model.CollaboratorPermission;
import com.example.dockerhub_clone.model.DockerRepository;
import com.example.dockerhub_clone.model.Tag;
import com.example.dockerhub_clone.model.User;
import com.example.dockerhub_clone.repository.TagRepository;
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
public class TagService {

    private final TagRepository tagRepository;
    private final ArtifactRepository artifactRepository;
    private final DockerRepositoryRepository repoRepository;
    private final CollaboratorRepository collaboratorRepository;
    private final AuthService authService;
    private final AuditLogService auditLogService;

    // --- Core functionality ---

    public TagResponseDto createTag(Long repoId, TagRequestDto request) {
        DockerRepository repo = findRepo(repoId);
        User current = authService.getCurrentUser();

        if (!canWrite(current, repo)) {
            throw new RuntimeException("Not authorized");
        }

        Artifact artifact = artifactRepository.findByDigest(request.getDigest())
                .orElseThrow(() -> new RuntimeException("Artifact not found"));

        if (!artifact.getRepository().getId().equals(repo.getId())) {
            throw new RuntimeException("Artifact does not belong to repository");
        }

        Tag tag = Tag.builder()
                .name(request.getName())
                .artifact(artifact)
                .repository(repo)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        Tag saved = tagRepository.save(tag);

        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("repository", repo.getName());
        metadata.put("tag", saved.getName());
        metadata.put("artifactDigest", artifact.getDigest());

        auditLogService.recordAction(current, "TAG_CREATE", "TAG", saved.getId().toString(), metadata);

        return mapToDto(saved);
    }

    public void deleteTag(Long repoId, String tagName) {
        DockerRepository repo = findRepo(repoId);
        User current = authService.getCurrentUser();

        if (!canAdmin(current, repo)) {
            throw new RuntimeException("Not authorized");
        }

        Tag tag = tagRepository.findByRepositoryAndName(repo, tagName)
                .orElseThrow(() -> new RuntimeException("Tag not found"));

        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("repository", repo.getName());
        metadata.put("tag", tag.getName());
        metadata.put("artifactDigest", tag.getArtifact().getDigest());

        auditLogService.recordAction(current, "TAG_DELETE", "TAG", tag.getId().toString(), metadata);

        tagRepository.delete(tag);
    }

    public TagResponseDto retag(Long repoId, String oldTagName, String newTagName) {
        DockerRepository repo = findRepo(repoId);
        User current = authService.getCurrentUser();

        if (!canWrite(current, repo)) {
            throw new RuntimeException("Not authorized");
        }

        Tag tag = tagRepository.findByRepositoryAndName(repo, oldTagName)
                .orElseThrow(() -> new RuntimeException("Tag not found"));

        String oldName = tag.getName();

        tag.setName(newTagName);
        tag.setUpdatedAt(Instant.now());

        Tag saved = tagRepository.save(tag);

        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("repository", repo.getName());
        metadata.put("from", oldName);
        metadata.put("to", saved.getName());
        metadata.put("artifactDigest", saved.getArtifact().getDigest());

        auditLogService.recordAction(current, "TAG_RENAME", "TAG", saved.getId().toString(), metadata);

        return mapToDto(saved);
    }

    public List<TagResponseDto> listTags(Long repoId) {
        DockerRepository repo = findRepo(repoId);
        User current = authService.getCurrentUser();

        if (!(repo.isPublic() || canRead(current, repo))) {
            throw new RuntimeException("Not authorized");
        }

        return tagRepository.findByRepository(repo).stream()
                .map(this::mapToDto)
                .toList();
    }

    // --- Helpers ---

    private DockerRepository findRepo(Long repoId) {
        return repoRepository.findById(repoId)
                .orElseThrow(() -> new RuntimeException("Repository not found"));
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

    private boolean canAdmin(User user, DockerRepository repo) {
        return repo.getOwner().equals(user) ||
                collaboratorRepository.findByRepositoryAndUser(repo, user)
                        .map(c -> c.getPermission() == CollaboratorPermission.ADMIN)
                        .orElse(false);
    }

    private TagResponseDto mapToDto(Tag tag) {
        return TagResponseDto.builder()
                .id(tag.getId())
                .name(tag.getName())
                .artifactDigest(tag.getArtifact().getDigest())
                .repositoryName(tag.getRepository().getName())
                .build();
    }
}