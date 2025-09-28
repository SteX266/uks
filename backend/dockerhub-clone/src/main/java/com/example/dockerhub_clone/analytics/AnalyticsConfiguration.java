package com.example.dockerhub_clone.analytics;

import java.time.Duration;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

@Configuration
@RequiredArgsConstructor
@EnableConfigurationProperties({ElasticsearchProperties.class, LogIngestionProperties.class})
public class AnalyticsConfiguration {

    private final ElasticsearchProperties elasticsearchProperties;

    @Bean
    public RestTemplate elasticsearchRestTemplate(RestTemplateBuilder builder) {
        RestTemplateBuilder restTemplateBuilder = builder
                .setConnectTimeout(Duration.ofSeconds(5))
                .setReadTimeout(Duration.ofSeconds(30))
                .rootUri(elasticsearchProperties.getHost());

        if (StringUtils.hasText(elasticsearchProperties.getUsername())
                && StringUtils.hasText(elasticsearchProperties.getPassword())) {
            restTemplateBuilder = restTemplateBuilder.basicAuthentication(
                    elasticsearchProperties.getUsername(), elasticsearchProperties.getPassword());
        }

        return restTemplateBuilder.build();
    }
}