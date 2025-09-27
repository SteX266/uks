package com.example.dockerhub_clone.model;

import com.fasterxml.jackson.annotation.JsonValue;

public enum RepositoryBadge {
    DOCKER_OFFICIAL_IMAGE("Docker Official Image"),
    VERIFIED_PUBLISHER("Verified Publisher"),
    SPONSORED_OSS("Sponsored OSS");

    private final String label;

    RepositoryBadge(String label) {
        this.label = label;
    }

    @JsonValue
    public String getLabel() {
        return label;
    }
}