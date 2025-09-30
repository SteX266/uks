package com.example.dockerhub_clone.controller;

import com.example.dockerhub_clone.dto.CreateRepositoryRequestDto;
import com.example.dockerhub_clone.dto.ExploreRepositoryResponseDto;
import com.example.dockerhub_clone.dto.RepositoryResponseDto;
import com.example.dockerhub_clone.security.JwtAuthFilter;
import com.example.dockerhub_clone.service.RepositoryService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(RepositoryController.class)
@AutoConfigureMockMvc(addFilters = false)
class RepositoryControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RepositoryService repositoryService;

    @MockBean
    private JwtAuthFilter jwtAuthFilter;

    @Test
    @DisplayName("POST /api/repositories should return created repository")
    @WithMockUser(roles = "USER")
    void createRepository_returnsResponse() throws Exception {
        CreateRepositoryRequestDto request = new CreateRepositoryRequestDto();
        request.setName("demo");
        request.setDescription("A demo repository");
        request.setPublic(true);
        request.setOfficial(false);

        RepositoryResponseDto responseDto = RepositoryResponseDto.builder()
                .id(1L)
                .name("demo")
                .description("A demo repository")
                .isPublic(true)
                .isOfficial(false)
                .ownerUsername("owner")
                .createdAt(Instant.parse("2024-01-01T00:00:00Z"))
                .updatedAt(Instant.parse("2024-01-02T00:00:00Z"))
                .isVerifiedPublisher(false)
                .isSponsoredOss(false)
                .build();

        when(repositoryService.createRepo(any(CreateRepositoryRequestDto.class))).thenReturn(responseDto);

        mockMvc.perform(post("/api/repositories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("demo"))
                .andExpect(jsonPath("$.isPublic").value(true));

        verify(repositoryService).createRepo(any(CreateRepositoryRequestDto.class));
    }

    @Test
    @DisplayName("GET /api/repositories/me should return user repositories")
    @WithMockUser(roles = "USER")
    void listMyRepositories_returnsResults() throws Exception {
        RepositoryResponseDto repoDto = RepositoryResponseDto.builder()
                .id(3L)
                .name("personal")
                .description("Personal repo")
                .isPublic(false)
                .isOfficial(false)
                .ownerUsername("me")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .isVerifiedPublisher(false)
                .isSponsoredOss(false)
                .build();

        when(repositoryService.listMyRepos()).thenReturn(List.of(repoDto));

        mockMvc.perform(get("/api/repositories/me"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].name").value("personal"));

        verify(repositoryService).listMyRepos();
    }

    @Test
    @DisplayName("GET /api/repositories/explore should expose public repositories")
    void exploreRepositories_returnsPublicList() throws Exception {
        ExploreRepositoryResponseDto exploreDto = ExploreRepositoryResponseDto.builder()
                .id(9L)
                .name("public")
                .namespace("library")
                .description("Public repo")
                .badges(List.of("Docker Official Image"))
                .tags(List.of("latest"))
                .stars(100L)
                .pulls(200L)
                .updatedAt(Instant.parse("2024-02-01T00:00:00Z"))
                .build();

        when(repositoryService.listPublicRepositoriesForExplore()).thenReturn(List.of(exploreDto));

        mockMvc.perform(get("/api/repositories/explore"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("public"))
                .andExpect(jsonPath("$[0].namespace").value("library"));

        verify(repositoryService).listPublicRepositoriesForExplore();
    }

    @Test
    @DisplayName("DELETE /api/repositories/{id} should return no content")
    @WithMockUser(roles = "USER")
    void deleteRepository_returnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/repositories/{id}", 7))
                .andExpect(status().isNoContent());

        verify(repositoryService).deleteRepo(7L);
    }

    @Test
    @DisplayName("PUT /api/repositories/{id} should update repository")
    @WithMockUser(roles = "USER")
    void editRepository_returnsUpdatedDto() throws Exception {
        CreateRepositoryRequestDto request = new CreateRepositoryRequestDto();
        request.setName("updated");
        request.setDescription("Updated description");
        request.setPublic(false);
        request.setOfficial(true);

        RepositoryResponseDto responseDto = RepositoryResponseDto.builder()
                .id(4L)
                .name("updated")
                .description("Updated description")
                .isPublic(false)
                .isOfficial(true)
                .ownerUsername("owner")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .isVerifiedPublisher(true)
                .isSponsoredOss(true)
                .build();

        when(repositoryService.editRepo(eq(4L), any(CreateRepositoryRequestDto.class))).thenReturn(responseDto);

        mockMvc.perform(put("/api/repositories/{id}", 4)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isOfficial").value(true))
                .andExpect(jsonPath("$.description").value("Updated description"));

        verify(repositoryService).editRepo(eq(4L), any(CreateRepositoryRequestDto.class));
    }

    @Test
    @DisplayName("POST /api/repositories/{id}/make-official should require admin role")
    @WithMockUser(roles = "ADMIN")
    void makeOfficial_returnsUpdatedRepository() throws Exception {
        RepositoryResponseDto responseDto = RepositoryResponseDto.builder()
                .id(12L)
                .name("official")
                .description("Official repo")
                .isPublic(true)
                .isOfficial(true)
                .ownerUsername("admin")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .isVerifiedPublisher(true)
                .isSponsoredOss(false)
                .build();

        when(repositoryService.markAsOfficial(12L)).thenReturn(responseDto);

        mockMvc.perform(post("/api/repositories/{id}/make-official", 12))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isOfficial").value(true));

        verify(repositoryService).markAsOfficial(12L);
    }
}