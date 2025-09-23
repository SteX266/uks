package com.example.dockerhub_clone.repository;

import com.example.dockerhub_clone.model.Tag;
import com.example.dockerhub_clone.model.DockerRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface TagRepository extends JpaRepository<Tag, Long> {
    Optional<Tag> findByRepositoryAndName(DockerRepository repository, String name);
    List<Tag> findByRepository(DockerRepository repository);
}
