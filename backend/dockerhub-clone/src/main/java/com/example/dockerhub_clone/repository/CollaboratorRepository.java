package com.example.dockerhub_clone.repository;

import com.example.dockerhub_clone.model.Collaborator;
import com.example.dockerhub_clone.model.DockerRepository;
import com.example.dockerhub_clone.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface CollaboratorRepository extends JpaRepository<Collaborator, Long> {
    Optional<Collaborator> findByRepositoryAndUser(DockerRepository repo, User user);
    List<Collaborator> findByRepository(DockerRepository repo);
}
