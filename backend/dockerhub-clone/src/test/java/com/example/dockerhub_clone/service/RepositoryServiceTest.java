package com.example.dockerhub_clone.service;

import com.example.dockerhub_clone.dto.CreateRepositoryRequestDto;
import com.example.dockerhub_clone.dto.RepositoryResponseDto;
import com.example.dockerhub_clone.model.Collaborator;
import com.example.dockerhub_clone.model.CollaboratorPermission;
import com.example.dockerhub_clone.model.DockerRepository;
import com.example.dockerhub_clone.model.User;
import com.example.dockerhub_clone.model.UserBadge;
import com.example.dockerhub_clone.repository.CollaboratorRepository;
import com.example.dockerhub_clone.repository.DockerRepositoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.EnumSet;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RepositoryServiceTest {

    @Mock
    private DockerRepositoryRepository repoRepository;
    @Mock
    private CollaboratorRepository collaboratorRepository;
    @Mock
    private AuthService authService;
    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private RepositoryService repositoryService;

    private User owner;

    @BeforeEach
    void setUp() {
        owner = User.builder()
                .id(1L)
                .username("owner")
                .badges(EnumSet.of(UserBadge.VERIFIED_PUBLISHER, UserBadge.SPONSORED_OSS))
                .build();

        when(authService.getCurrentUser()).thenReturn(owner);
    }

    @Test
    @DisplayName("createRepo should persist repository, propagate badges and record audit log")
    void createRepo_persistsRepositoryAndRecordsAuditLog() {
        CreateRepositoryRequestDto request = new CreateRepositoryRequestDto();
        request.setName(" demo-repo ");
        request.setDescription("Sample description");
        request.setPublic(true);
        request.setOfficial(false);

        DockerRepository persisted = DockerRepository.builder()
                .id(42L)
                .name("demo-repo")
                .description("Sample description")
                .isPublic(true)
                .isOfficial(false)
                .isVerifiedPublisher(true)
                .isSponsoredOss(true)
                .owner(owner)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        when(repoRepository.save(any(DockerRepository.class))).thenReturn(persisted);

        RepositoryResponseDto response = repositoryService.createRepo(request);

        ArgumentCaptor<DockerRepository> repoCaptor = ArgumentCaptor.forClass(DockerRepository.class);
        verify(repoRepository).save(repoCaptor.capture());
        DockerRepository toSave = repoCaptor.getValue();

        assertThat(toSave.getName()).isEqualTo("demo-repo");
        assertThat(toSave.getDescription()).isEqualTo("Sample description");
        assertThat(toSave.isPublic()).isTrue();
        assertThat(toSave.isOfficial()).isFalse();
        assertThat(toSave.isVerifiedPublisher()).isTrue();
        assertThat(toSave.isSponsoredOss()).isTrue();
        assertThat(toSave.getOwner()).isEqualTo(owner);
        assertThat(toSave.getCreatedAt()).isNotNull();
        assertThat(toSave.getUpdatedAt()).isNotNull();

        assertThat(response.getId()).isEqualTo(42L);
        assertThat(response.getName()).isEqualTo("demo-repo");
        assertThat(response.isPublic()).isTrue();
        assertThat(response.isOfficial()).isFalse();
        assertThat(response.isVerifiedPublisher()).isTrue();
        assertThat(response.isSponsoredOss()).isTrue();
        assertThat(response.getOwnerUsername()).isEqualTo("owner");

        verify(auditLogService).recordAction(eq(owner), eq("REPOSITORY_CREATE"), eq("REPOSITORY"), eq("42"), any());
    }

    @Test
    @DisplayName("createRepo should throw when repository name is blank")
    void createRepo_blankName_throws() {
        CreateRepositoryRequestDto request = new CreateRepositoryRequestDto();
        request.setName("   ");

        assertThatThrownBy(() -> repositoryService.createRepo(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Repository name is required");

        verifyNoInteractions(repoRepository, auditLogService);
    }

    @Nested
    class EditRepository {

        private DockerRepository existing;

        @BeforeEach
        void initRepo() {
            existing = DockerRepository.builder()
                    .id(55L)
                    .name("existing")
                    .description("old")
                    .isPublic(false)
                    .isOfficial(false)
                    .owner(owner)
                    .createdAt(Instant.now().minusSeconds(1000))
                    .updatedAt(Instant.now().minusSeconds(500))
                    .build();
        }

        @Test
        @DisplayName("editRepo should update repository when user has permissions")
        void editRepo_withPermission_updates() {
            CreateRepositoryRequestDto request = new CreateRepositoryRequestDto();
            request.setName("updated");
            request.setDescription("new description");
            request.setPublic(true);
            request.setOfficial(true);

            when(repoRepository.findById(55L)).thenReturn(Optional.of(existing));
            when(repoRepository.save(any(DockerRepository.class))).thenAnswer(invocation -> invocation.getArgument(0));

            RepositoryResponseDto response = repositoryService.editRepo(55L, request);

            assertThat(existing.getName()).isEqualTo("updated");
            assertThat(existing.getDescription()).isEqualTo("new description");
            assertThat(existing.isPublic()).isTrue();
            assertThat(existing.isOfficial()).isTrue();

            assertThat(response.getName()).isEqualTo("updated");
            assertThat(response.getDescription()).isEqualTo("new description");
            assertThat(response.isPublic()).isTrue();
            assertThat(response.isOfficial()).isTrue();

            verify(auditLogService).recordAction(eq(owner), eq("REPOSITORY_UPDATE"), eq("REPOSITORY"), eq("55"), any());
        }

        @Test
        @DisplayName("editRepo should reject user without write permissions")
        void editRepo_withoutPermission_throws() {
            User stranger = User.builder().id(9L).username("stranger").build();
            when(authService.getCurrentUser()).thenReturn(stranger);
            when(repoRepository.findById(55L)).thenReturn(Optional.of(existing));
            when(collaboratorRepository.findByRepositoryAndUser(existing, stranger)).thenReturn(Optional.empty());

            CreateRepositoryRequestDto request = new CreateRepositoryRequestDto();
            request.setDescription("irrelevant");

            assertThatThrownBy(() -> repositoryService.editRepo(55L, request))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Not authorized");

            verify(repoRepository, never()).save(any());
            verifyNoInteractions(auditLogService);
        }
    }

    @Test
    @DisplayName("deleteRepo should require admin permissions")
    void deleteRepo_requiresAdminPermission() {
        DockerRepository repo = DockerRepository.builder()
                .id(77L)
                .name("demo")
                .owner(owner)
                .build();
        when(repoRepository.findById(77L)).thenReturn(Optional.of(repo));

        repositoryService.deleteRepo(77L);

        verify(repoRepository).delete(repo);
        verify(auditLogService).recordAction(eq(owner), eq("REPOSITORY_DELETE"), eq("REPOSITORY"), eq("77"), any());
    }

    @Test
    @DisplayName("deleteRepo should throw when user lacks admin access")
    void deleteRepo_withoutAdmin_throws() {
        User other = User.builder().id(2L).username("other").build();
        DockerRepository repo = DockerRepository.builder()
                .id(88L)
                .name("protected")
                .owner(other)
                .build();

        when(authService.getCurrentUser()).thenReturn(owner);
        when(repoRepository.findById(88L)).thenReturn(Optional.of(repo));
        when(collaboratorRepository.findByRepositoryAndUser(repo, owner)).thenReturn(Optional.of(
                Collaborator.builder().repository(repo).user(owner).permission(CollaboratorPermission.READ).build()
        ));

        assertThatThrownBy(() -> repositoryService.deleteRepo(88L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Not authorized");

        verify(repoRepository, never()).delete(any());
        verifyNoInteractions(auditLogService);
    }
}