package com.example.dockerhub_clone.service;

import com.example.dockerhub_clone.model.AuditLog;
import com.example.dockerhub_clone.model.User;
import com.example.dockerhub_clone.repository.AuditLogRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

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
                .build();
        return auditLogRepository.save(auditLog);
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