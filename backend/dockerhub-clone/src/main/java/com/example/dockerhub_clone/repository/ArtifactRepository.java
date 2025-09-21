package com.example.dockerhub_clone.repository;

import com.example.dockerhub_clone.model.Artifact;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ArtifactRepository extends JpaRepository<Artifact, Long> {
    Optional<Artifact> findByDigest(String digest);
}
