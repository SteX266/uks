package com.example.dockerhub_clone.repository;

import com.example.dockerhub_clone.model.RepoEvent;
import com.example.dockerhub_clone.model.DockerRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.List;

public interface RepoEventRepository extends JpaRepository<RepoEvent, Long> {
    List<RepoEvent> findByRepositoryAndOccurredAtBetween(
            DockerRepository repository, Instant from, Instant to
    );
}
