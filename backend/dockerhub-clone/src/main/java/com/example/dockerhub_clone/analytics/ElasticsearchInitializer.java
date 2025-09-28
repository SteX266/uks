package com.example.dockerhub_clone.analytics;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class ElasticsearchInitializer {

    private final RestTemplate elasticsearchRestTemplate;
    private final ElasticsearchProperties elasticsearchProperties;

    @PostConstruct
    public void init() {
        try {
            String index = elasticsearchProperties.getIndex();
            ResponseEntity<String> response = elasticsearchRestTemplate.getForEntity("/" + index, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Elasticsearch index '{}' already exists", index);
            }
        } catch (Exception e) {
            // If index does not exist, create it
            String index = elasticsearchProperties.getIndex();
            log.info("Creating Elasticsearch index '{}'", index);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Minimal mapping for logs
            String body = """
                {
                  "mappings": {
                    "properties": {
                      "timestamp": { "type": "date" },
                      "level": { "type": "keyword" },
                      "message": { "type": "text" },
                      "raw": { "type": "text" },
                      "source": { "type": "keyword" }
                    }
                  }
                }
            """;

            HttpEntity<String> entity = new HttpEntity<>(body, headers);
            elasticsearchRestTemplate.put("/" + index, entity, String.class);
            log.info("Index '{}' created successfully", index);
        }
    }
}
