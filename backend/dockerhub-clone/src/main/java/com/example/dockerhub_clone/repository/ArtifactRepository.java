package com.example.dockerhub_clone.repository;

import com.example.dockerhub_clone.model.Artifact;
import com.example.dockerhub_clone.model.DockerRepository;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ArtifactRepository extends JpaRepository<Artifact, Long> {
    Optional<Artifact> findByDigest(String digest);
    List<Artifact> findByRepository(DockerRepository repository);
}
