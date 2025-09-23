package com.example.dockerhub_clone.repository;

import com.example.dockerhub_clone.model.Star;
import com.example.dockerhub_clone.model.DockerRepository;
import com.example.dockerhub_clone.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface StarRepository extends JpaRepository<Star, Long> {
    Optional<Star> findByUserAndRepository(User user, DockerRepository repository);
    long countByRepository(DockerRepository repository);
}
