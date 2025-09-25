package com.example.dockerhub_clone.dto;

import com.example.dockerhub_clone.model.CollaboratorPermission;
import lombok.Data;

@Data
public class AddCollaboratorRequestDto {
    private String username;
    private CollaboratorPermission permission;
}
