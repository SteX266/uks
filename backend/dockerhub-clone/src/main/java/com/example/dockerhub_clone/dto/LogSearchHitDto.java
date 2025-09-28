package com.example.dockerhub_clone.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LogSearchHitDto {
    private String id;
    private Double score;
    private String timestamp;
    private String level;
    private String message;
    private String raw;
    private String source;
    private String highlight;
}