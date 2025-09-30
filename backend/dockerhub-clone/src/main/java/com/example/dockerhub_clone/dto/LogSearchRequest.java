package com.example.dockerhub_clone.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LogSearchRequest {

    @NotBlank(message = "Query is required")
    private String query;

    @Min(value = 0, message = "Offset must be zero or positive")
    private Integer from;

    @Min(value = 1, message = "Page size must be greater than zero")
    @Max(value = 200, message = "Page size cannot exceed 200")
    private Integer size;

    public int resolveFrom() {
        return from != null ? from : 0;
    }

    public int resolveSize() {
        int resolved = size != null ? size : 20;
        return Math.min(Math.max(resolved, 1), 200);
    }
}