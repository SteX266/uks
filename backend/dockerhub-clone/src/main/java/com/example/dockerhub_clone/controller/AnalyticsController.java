package com.example.dockerhub_clone.controller;

import com.example.dockerhub_clone.analytics.AnalyticsService;
import com.example.dockerhub_clone.dto.LogSearchRequest;
import com.example.dockerhub_clone.dto.LogSearchResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @PostMapping("/search")
    public LogSearchResponse search(@Valid @RequestBody LogSearchRequest request) {
        System.out.println("ENTEREEEEEED");
        return analyticsService.search(request);
    }
}