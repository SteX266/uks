package com.example.dockerhub_clone.repository;

import com.example.dockerhub_clone.model.DockerRepository;
import com.example.dockerhub_clone.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface DockerRepositoryRepository extends JpaRepository<DockerRepository, Long> {
    List<DockerRepository> findByOwner(User owner);
    Optional<DockerRepository> findByOwnerAndName(User owner, String name);
    List<DockerRepository> findByIsPublicTrueOrderByStarsCountDesc();
}
