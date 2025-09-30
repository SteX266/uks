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
public class ProfileActivityDto {
    private String title;
    private String detail;
    private Instant occurredAt;
}