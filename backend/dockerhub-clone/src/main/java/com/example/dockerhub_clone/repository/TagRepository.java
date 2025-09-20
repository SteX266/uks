package com.example.dockerhub_clone.repository;

import com.example.dockerhub_clone.model.Tag;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TagRepository extends JpaRepository<Tag, Long> {}
