package com.example.dockerhub_clone.controller;

import com.example.dockerhub_clone.dto.ArtifactRequestDto;
import com.example.dockerhub_clone.dto.ArtifactResponseDto;
import com.example.dockerhub_clone.security.JwtAuthFilter;
import com.example.dockerhub_clone.service.ArtifactService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ArtifactController.class)
@AutoConfigureMockMvc(addFilters = false)
class ArtifactControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ArtifactService artifactService;

    @MockBean
    private JwtAuthFilter jwtAuthFilter;

    @Test
    @DisplayName("POST /api/repositories/{repoId}/artifacts should create artifact")
    @WithMockUser(roles = "USER")
    void createArtifact_returnsCreatedResource() throws Exception {
        ArtifactRequestDto request = new ArtifactRequestDto();
        request.setDigest("sha256:abc");
        request.setMediaType("application/json");
        request.setSize(512L);

        ArtifactResponseDto responseDto = ArtifactResponseDto.builder()
                .id(3L)
                .digest("sha256:abc")
                .mediaType("application/json")
                .size(512L)
                .repositoryName("demo")
                .createdAt(Instant.parse("2024-03-01T00:00:00Z"))
                .build();

        when(artifactService.createArtifact(eq(7L), any(ArtifactRequestDto.class))).thenReturn(responseDto);

        mockMvc.perform(post("/api/repositories/{repoId}/artifacts", 7)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(3))
                .andExpect(jsonPath("$.digest").value("sha256:abc"));

        verify(artifactService).createArtifact(eq(7L), any(ArtifactRequestDto.class));
    }

    @Test
    @DisplayName("GET /api/repositories/{repoId}/artifacts should list artifacts")
    void listArtifacts_returnsCollection() throws Exception {
        ArtifactResponseDto artifact = ArtifactResponseDto.builder()
                .id(1L)
                .digest("sha256:def")
                .size(1024L)
                .mediaType("application/vnd.oci.image.manifest.v1+json")
                .repositoryName("demo")
                .createdAt(Instant.now())
                .build();

        when(artifactService.listArtifacts(5L)).thenReturn(List.of(artifact));

        mockMvc.perform(get("/api/repositories/{repoId}/artifacts", 5))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].digest").value("sha256:def"));

        verify(artifactService).listArtifacts(5L);
    }
}