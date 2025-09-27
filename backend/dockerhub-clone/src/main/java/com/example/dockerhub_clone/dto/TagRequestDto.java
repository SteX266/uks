package com.example.dockerhub_clone.dto;

import lombok.Data;

@Data
public class TagRequestDto {
    private String name;
    private String digest;
}
