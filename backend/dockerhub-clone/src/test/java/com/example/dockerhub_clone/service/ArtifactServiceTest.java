package com.example.dockerhub_clone.service;

import com.example.dockerhub_clone.dto.ArtifactRequestDto;
import com.example.dockerhub_clone.dto.ArtifactResponseDto;
import com.example.dockerhub_clone.model.Artifact;
import com.example.dockerhub_clone.model.Collaborator;
import com.example.dockerhub_clone.model.CollaboratorPermission;
import com.example.dockerhub_clone.model.DockerRepository;
import com.example.dockerhub_clone.model.User;
import com.example.dockerhub_clone.repository.ArtifactRepository;
import com.example.dockerhub_clone.repository.CollaboratorRepository;
import com.example.dockerhub_clone.repository.DockerRepositoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ArtifactServiceTest {

    @Mock
    private ArtifactRepository artifactRepository;
    @Mock
    private DockerRepositoryRepository repoRepository;
    @Mock
    private CollaboratorRepository collaboratorRepository;
    @Mock
    private AuthService authService;
    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private ArtifactService artifactService;

    private DockerRepository repository;
    private User owner;

    @BeforeEach
    void setUp() {
        owner = User.builder().id(1L).username("owner").build();
        repository = DockerRepository.builder()
                .id(5L)
                .name("sample")
                .owner(owner)
                .isPublic(false)
                .createdAt(Instant.now().minusSeconds(1000))
                .updatedAt(Instant.now().minusSeconds(1000))
                .build();
    }

    @Test
    @DisplayName("createArtifact should persist artifact and update repository metadata when user can write")
    void createArtifact_authorizedUser_succeeds() {
        ArtifactRequestDto request = new ArtifactRequestDto();
        request.setDigest("sha256:123");
        request.setMediaType("application/vnd.oci.image.manifest.v1+json");
        request.setSize(2048L);

        when(repoRepository.findById(5L)).thenReturn(Optional.of(repository));
        when(authService.getCurrentUser()).thenReturn(owner);
        when(artifactRepository.save(any(Artifact.class))).thenAnswer(invocation -> {
            Artifact artifact = invocation.getArgument(0);
            artifact.setId(10L);
            return artifact;
        });
        when(repoRepository.save(any(DockerRepository.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ArtifactResponseDto response = artifactService.createArtifact(5L, request);

        ArgumentCaptor<Artifact> artifactCaptor = ArgumentCaptor.forClass(Artifact.class);
        verify(artifactRepository).save(artifactCaptor.capture());
        Artifact saved = artifactCaptor.getValue();

        assertThat(saved.getDigest()).isEqualTo("sha256:123");
        assertThat(saved.getMediaType()).isEqualTo("application/vnd.oci.image.manifest.v1+json");
        assertThat(saved.getSize()).isEqualTo(2048L);
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getRepository()).isEqualTo(repository);

        assertThat(repository.getLastPushedAt()).isNotNull();
        assertThat(repository.getUpdatedAt()).isAfter(repository.getCreatedAt());

        assertThat(response.getId()).isEqualTo(10L);
        assertThat(response.getDigest()).isEqualTo("sha256:123");
        assertThat(response.getRepositoryName()).isEqualTo("sample");

        verify(auditLogService).recordAction(eq(owner), eq("ARTIFACT_CREATE"), eq("ARTIFACT"), eq("10"), any());
    }

    @Test
    @DisplayName("createArtifact should reject users without write access")
    void createArtifact_withoutPermission_throws() {
        User stranger = User.builder().id(99L).username("stranger").build();
        when(repoRepository.findById(5L)).thenReturn(Optional.of(repository));
        when(authService.getCurrentUser()).thenReturn(stranger);
        when(collaboratorRepository.findByRepositoryAndUser(repository, stranger)).thenReturn(Optional.empty());

        ArtifactRequestDto request = new ArtifactRequestDto();
        request.setDigest("sha256:abc");

        assertThatThrownBy(() -> artifactService.createArtifact(5L, request))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Not authorized");

        verify(artifactRepository, never()).save(any());
        verifyNoInteractions(auditLogService);
    }

    @Test
    @DisplayName("listArtifacts should return data when repository is public")
    void listArtifacts_publicRepository_allowsAccess() {
        repository.setPublic(true);

        Artifact artifact = Artifact.builder()
                .id(2L)
                .digest("sha256:def")
                .mediaType("application/json")
                .size(1024L)
                .createdAt(Instant.now())
                .repository(repository)
                .build();

        when(repoRepository.findById(5L)).thenReturn(Optional.of(repository));
        when(authService.getCurrentUser()).thenReturn(User.builder().id(5L).username("viewer").build());
        when(artifactRepository.findByRepository(repository)).thenReturn(List.of(artifact));

        List<ArtifactResponseDto> result = artifactService.listArtifacts(5L);

        assertThat(result).hasSize(1);
        ArtifactResponseDto dto = result.get(0);
        assertThat(dto.getId()).isEqualTo(2L);
        assertThat(dto.getDigest()).isEqualTo("sha256:def");
        assertThat(dto.getRepositoryName()).isEqualTo("sample");
    }

    @Test
    @DisplayName("listArtifacts should fail when user has no access and repository is private")
    void listArtifacts_privateRepositoryWithoutPermissions_throws() {
        User stranger = User.builder().id(3L).username("stranger").build();
        when(repoRepository.findById(5L)).thenReturn(Optional.of(repository));
        when(authService.getCurrentUser()).thenReturn(stranger);
        when(collaboratorRepository.findByRepositoryAndUser(repository, stranger)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> artifactService.listArtifacts(5L))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Not authorized");

        verifyNoInteractions(artifactRepository);
    }

    @Test
    @DisplayName("createArtifact should allow collaborator with write access")
    void createArtifact_collaboratorWithWriteAccess_succeeds() {
        User collaboratorUser = User.builder().id(4L).username("collaborator").build();
        when(repoRepository.findById(5L)).thenReturn(Optional.of(repository));
        when(authService.getCurrentUser()).thenReturn(collaboratorUser);
        when(collaboratorRepository.findByRepositoryAndUser(repository, collaboratorUser))
                .thenReturn(Optional.of(Collaborator.builder()
                        .repository(repository)
                        .user(collaboratorUser)
                        .permission(CollaboratorPermission.WRITE)
                        .build()));

        when(artifactRepository.save(any(Artifact.class))).thenAnswer(invocation -> {
            Artifact artifact = invocation.getArgument(0);
            artifact.setId(11L);
            return artifact;
        });
        when(repoRepository.save(any(DockerRepository.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ArtifactRequestDto request = new ArtifactRequestDto();
        request.setDigest("sha256:ff");

        ArtifactResponseDto dto = artifactService.createArtifact(5L, request);

        assertThat(dto.getId()).isEqualTo(11L);
        verify(auditLogService).recordAction(eq(collaboratorUser), eq("ARTIFACT_CREATE"), eq("ARTIFACT"), eq("11"), any());
    }
}