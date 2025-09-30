package com.example.dockerhub_clone.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProfileRepositoryDto {
    private String name;
    private String description;
    private long stars;
    private Instant updatedAt;
}