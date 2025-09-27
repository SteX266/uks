package com.example.dockerhub_clone.config;

import com.example.dockerhub_clone.model.Role;
import com.example.dockerhub_clone.model.RoleName;
import com.example.dockerhub_clone.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;

    @Override
    public void run(String... args) {
        for (RoleName rn : RoleName.values()) {
            //roleRepository.findByName(rn).orElseGet(() ->
             //       roleRepository.save(Role.builder().name(rn).build())
          //  );
        }
    }
}
