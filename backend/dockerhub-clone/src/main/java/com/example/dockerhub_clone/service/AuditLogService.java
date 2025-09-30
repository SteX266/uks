package com.example.dockerhub_clone.service;

import com.example.dockerhub_clone.model.AuditLog;
import com.example.dockerhub_clone.model.User;
import com.example.dockerhub_clone.repository.AuditLogRepository;
import com.example.dockerhub_clone.analytics.ElasticsearchProperties;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;
    private final RestTemplate elasticsearchRestTemplate;
    private final ElasticsearchProperties elasticsearchProperties;

    public AuditLog recordAction(User actor, String action, String targetType, String targetId) {
        return recordAction(actor, action, targetType, targetId, null);
    }

    public AuditLog recordAction(User actor, String action, String targetType, String targetId, Map<String, ?> metadata) {
        AuditLog auditLog = AuditLog.builder()
                .actorUser(actor)
                .action(normalize(action))
                .targetType(normalize(targetType))
                .targetId(sanitize(targetId))
                .metadata(serialize(metadata))
                .createdAt(Instant.now())
                .build();

        AuditLog saved = auditLogRepository.save(auditLog);

        // Also ship to Elasticsearch
        shipToElasticsearch(saved);

        return saved;
    }

    private void shipToElasticsearch(AuditLog log) {
        if (!elasticsearchProperties.isEnabled()) {
            return;
        }

        try {
            Map<String, Object> json = new HashMap<>();
            json.put("timestamp", log.getCreatedAt().toString());
            json.put("level", "INFO"); // or ERROR/WARN if applicable
            json.put("message", log.getAction() + " on " + log.getTargetType());
            json.put("raw", log.toString());
            json.put("source", "audit-log");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(json), headers);
            elasticsearchRestTemplate.postForEntity(
                    "/" + elasticsearchProperties.getIndex() + "/_doc",
                    entity,
                    String.class
            );

        } catch (Exception e) {
            System.out.println("ERRORRRR");
        }
    }

    private String normalize(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim().replace(' ', '_').toUpperCase();
    }

    private String sanitize(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private String serialize(Map<String, ?> metadata) {
        if (metadata == null || metadata.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(metadata);
        } catch (JsonProcessingException e) {
            return metadata.toString();
        }
    }
}
