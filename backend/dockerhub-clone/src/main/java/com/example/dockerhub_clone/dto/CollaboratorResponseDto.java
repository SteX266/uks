package com.example.dockerhub_clone.dto;

import com.example.dockerhub_clone.model.CollaboratorPermission;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CollaboratorResponseDto {
    private Long id;
    private String username;
    private CollaboratorPermission permission;
}
