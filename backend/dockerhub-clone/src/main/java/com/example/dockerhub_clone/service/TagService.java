package com.example.dockerhub_clone.service;

import com.example.dockerhub_clone.dto.TagRequestDto;
import com.example.dockerhub_clone.dto.TagResponseDto;
import com.example.dockerhub_clone.model.DockerRepository;
import com.example.dockerhub_clone.model.Tag;
import com.example.dockerhub_clone.model.Artifact;
import com.example.dockerhub_clone.model.User;
import com.example.dockerhub_clone.repository.TagRepository;
import com.example.dockerhub_clone.repository.ArtifactRepository;
import com.example.dockerhub_clone.repository.DockerRepositoryRepository;
import com.example.dockerhub_clone.repository.CollaboratorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TagService {

    private final TagRepository tagRepository;
    private final ArtifactRepository artifactRepository;
    private final DockerRepositoryRepository repoRepository;
    private final CollaboratorRepository collaboratorRepository;
    private final AuthService authService;

    // --- Core functionality ---

    public TagResponseDto createTag(Long repoId, TagRequestDto request) {
        DockerRepository repo = findRepo(repoId);
        User current = authService.getCurrentUser();

        if (!canWrite(current, repo)) {
            throw new RuntimeException("Not authorized");
        }

        Artifact artifact = artifactRepository.findByDigest(request.getDigest())
                .orElseThrow(() -> new RuntimeException("Artifact not found"));

        Tag tag = Tag.builder()
                .name(request.getName())
                .artifact(artifact)
                .repository(repo)
                .createdAt(Instant.now())
                .build();

        return mapToDto(tagRepository.save(tag));
    }

    public void deleteTag(Long repoId, String tagName) {
        DockerRepository repo = findRepo(repoId);
        User current = authService.getCurrentUser();

        if (!canAdmin(current, repo)) {
            throw new RuntimeException("Not authorized");
        }

        Tag tag = tagRepository.findByRepositoryAndName(repo, tagName)
                .orElseThrow(() -> new RuntimeException("Tag not found"));

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

        tag.setName(newTagName);
        tag.setCreatedAt(Instant.now());

        return mapToDto(tagRepository.save(tag));
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
        // TODO: implement same logic as in RepositoryService
        return true;
    }

    private boolean canWrite(User user, DockerRepository repo) {
        // TODO: implement same logic as in RepositoryService
        return true;
    }

    private boolean canAdmin(User user, DockerRepository repo) {
        // TODO: implement same logic as in RepositoryService
        return true;
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
