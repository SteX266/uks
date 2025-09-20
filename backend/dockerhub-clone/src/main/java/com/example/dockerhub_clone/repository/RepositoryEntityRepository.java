package com.example.dockerhub_clone.repository;

import com.example.dockerhub_clone.model.RepositoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RepositoryEntityRepository extends JpaRepository<RepositoryEntity, Long> {}
