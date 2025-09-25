package com.example.dockerhub_clone.service;

import com.example.dockerhub_clone.dto.AddCollaboratorRequestDto;
import com.example.dockerhub_clone.dto.CollaboratorResponseDto;
import com.example.dockerhub_clone.model.*;
import com.example.dockerhub_clone.repository.CollaboratorRepository;
import com.example.dockerhub_clone.repository.DockerRepositoryRepository;
import com.example.dockerhub_clone.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CollaboratorService {

    private final CollaboratorRepository collaboratorRepository;
    private final DockerRepositoryRepository repoRepository;
    private final UserRepository userRepository;
    private final AuthService authService;

    public void addCollaborator(Long repoId, AddCollaboratorRequestDto request) {
        User currentUser = authService.getCurrentUser();
        DockerRepository repo = repoRepository.findById(repoId)
                .orElseThrow(() -> new RuntimeException("Repository not found"));

        if (!repo.getOwner().equals(currentUser) &&
                !hasAdminPermission(currentUser, repo)) {
            throw new RuntimeException("Not authorized to add collaborators");
        }

        User collaboratorUser = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Collaborator collaborator = Collaborator.builder()
                .repository(repo)
                .user(collaboratorUser)
                .permission(request.getPermission())
                .build();

        collaboratorRepository.save(collaborator);
    }

    public void removeCollaborator(Long repoId, String username) {
        User currentUser = authService.getCurrentUser();
        DockerRepository repo = repoRepository.findById(repoId)
                .orElseThrow(() -> new RuntimeException("Repository not found"));

        if (!repo.getOwner().equals(currentUser) &&
                !hasAdminPermission(currentUser, repo)) {
            throw new RuntimeException("Not authorized to remove collaborators");
        }

        User collaboratorUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Collaborator collaborator = collaboratorRepository
                .findByRepositoryAndUser(repo, collaboratorUser)
                .orElseThrow(() -> new RuntimeException("Collaborator not found"));

        collaboratorRepository.delete(collaborator);
    }

    private boolean hasAdminPermission(User user, DockerRepository repo) {
        return collaboratorRepository.findByRepositoryAndUser(repo, user)
                .map(c -> c.getPermission() == CollaboratorPermission.ADMIN)
                .orElse(false);
    }

    public List<CollaboratorResponseDto> listCollaborators(Long repoId) {
        DockerRepository repo = repoRepository.findById(repoId)
                .orElseThrow(() -> new RuntimeException("Repository not found"));

        return collaboratorRepository.findByRepository(repo).stream()
                .map(c -> CollaboratorResponseDto.builder()
                        .id(c.getId())
                        .username(c.getUser().getUsername())
                        .permission(c.getPermission())
                        .build())
                .toList();
    }

}
