package com.example.dockerhub_clone.analytics;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "analytics.elasticsearch")
public class ElasticsearchProperties {

    /**
     * Base URL of the Elasticsearch instance. Example: {@code http://localhost:9200}
     */
    private String host = "http://localhost:9200";

    /**
     * Optional username for basic authentication.
     */
    private String username;

    /**
     * Optional password for basic authentication.
     */
    private String password;

    /**
     * Name of the index where application logs are stored.
     */
    private String index = "application-logs";

    /**
     * When disabled the ingestion scheduler and search endpoints short-circuit.
     */
    private boolean enabled = false;

    /**
     * If true, the ingestion scheduler will attempt to ship new log lines to Elasticsearch.
     */
    private boolean ingestEnabled = true;

    /**
     * If true, administrators can execute search requests against Elasticsearch.
     */
    private boolean searchEnabled = true;
}