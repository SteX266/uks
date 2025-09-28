package com.example.dockerhub_clone.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LogSearchResponse {
    private long total;
    private int took;
    private String translatedQuery;
    private List<LogSearchHitDto> hits;
}