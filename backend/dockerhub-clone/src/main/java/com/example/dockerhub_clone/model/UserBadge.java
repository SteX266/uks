package com.example.dockerhub_clone.model;

import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Arrays;

public enum UserBadge {
    VERIFIED_PUBLISHER("Verified Publisher"),
    SPONSORED_OSS("Sponsored OSS");

    private final String label;

    UserBadge(String label) {
        this.label = label;
    }

    @JsonValue
    public String getLabel() {
        return label;
    }

    public static UserBadge fromLabel(String label) {
        return Arrays.stream(values())
                .filter(badge -> badge.label.equalsIgnoreCase(label))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown badge label: " + label));
    }
}