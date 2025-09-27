package com.example.dockerhub_clone.controller;

import com.example.dockerhub_clone.dto.TagRequestDto;
import com.example.dockerhub_clone.dto.TagResponseDto;
import com.example.dockerhub_clone.service.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/repositories/{repoId}/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;

    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    @PostMapping
    public ResponseEntity<TagResponseDto> createTag(
            @PathVariable Long repoId,
            @RequestBody TagRequestDto request
    ) {
        return ResponseEntity.ok(tagService.createTag(repoId, request));
    }

    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    @DeleteMapping("/{tagName}")
    public ResponseEntity<Void> deleteTag(
            @PathVariable Long repoId,
            @PathVariable String tagName
    ) {
        tagService.deleteTag(repoId, tagName);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    @PutMapping("/{oldTag}/retag/{newTag}")
    public ResponseEntity<TagResponseDto> retag(
            @PathVariable Long repoId,
            @PathVariable String oldTag,
            @PathVariable String newTag
    ) {
        return ResponseEntity.ok(tagService.retag(repoId, oldTag, newTag));
    }

    @GetMapping
    public ResponseEntity<List<TagResponseDto>> listTags(@PathVariable Long repoId) {
        return ResponseEntity.ok(tagService.listTags(repoId));
    }
}
