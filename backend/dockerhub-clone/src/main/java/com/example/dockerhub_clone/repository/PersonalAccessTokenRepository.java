package com.example.dockerhub_clone.repository;

import com.example.dockerhub_clone.model.PersonalAccessToken;
import com.example.dockerhub_clone.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface PersonalAccessTokenRepository extends JpaRepository<PersonalAccessToken, Long> {
    Optional<PersonalAccessToken> findByTokenHash(String tokenHash);
    List<PersonalAccessToken> findByUser(User user);
}
