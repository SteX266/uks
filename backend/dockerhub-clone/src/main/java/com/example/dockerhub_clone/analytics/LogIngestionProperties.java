package com.example.dockerhub_clone.analytics;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "analytics.logs")
public class LogIngestionProperties {

    /**
     * Controls whether the scheduler will look for new log lines.
     */
    private boolean enabled = false;

    /**
     * Paths (absolute or relative) to application log files.
     */
    private List<String> paths = new ArrayList<>(List.of("logs/application.log"));

    /**
     * Maximum number of log documents sent to Elasticsearch in a single bulk request.
     */
    private int bulkSize = 200;

    /**
     * How frequently the ingestion scheduler checks the files for new entries.
     */
    private Duration pollInterval = Duration.ofSeconds(30);

    /**
     * Delay before the first ingestion execution, giving the application time to bootstrap.
     */
    private Duration initialDelay = Duration.ofSeconds(5);
}