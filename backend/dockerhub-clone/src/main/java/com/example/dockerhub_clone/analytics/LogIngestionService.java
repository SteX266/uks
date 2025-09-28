package com.example.dockerhub_clone.analytics;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
@Slf4j
public class LogIngestionService {

    private static final DateTimeFormatter[] TIMESTAMP_FORMATS = new DateTimeFormatter[] {
            DateTimeFormatter.ISO_INSTANT,
            DateTimeFormatter.ISO_OFFSET_DATE_TIME,
            DateTimeFormatter.ISO_LOCAL_DATE_TIME
    };

    private final LogIngestionProperties ingestionProperties;
    private final ElasticsearchProperties elasticsearchProperties;
    private final RestTemplate elasticsearchRestTemplate;
    private final ObjectMapper objectMapper;

    private final Map<Path, Long> fileOffsets = new ConcurrentHashMap<>();

    @PostConstruct
    void onStart() {
        if (!ingestionProperties.isEnabled()) {
            log.info("Log ingestion scheduler disabled (analytics.logs.enabled=false)");
        }
    }

    @Scheduled(
            fixedDelayString = "${analytics.logs.poll-interval:PT30S}",
            initialDelayString = "${analytics.logs.initial-delay:PT5S}")
    public void shipNewLogLines() {
        if (!ingestionProperties.isEnabled()) {
            return;
        }
        if (!elasticsearchProperties.isEnabled() || !elasticsearchProperties.isIngestEnabled()) {
            return;
        }

        for (String configuredPath : ingestionProperties.getPaths()) {
            Path path = Paths.get(configuredPath).toAbsolutePath().normalize();
            if (!Files.exists(path)) {
                log.debug("Skipping ingestion for non-existent log file: {}", path);
                continue;
            }
            if (!Files.isRegularFile(path)) {
                log.warn("Configured log path is not a file: {}", path);
                continue;
            }

            try {
                processFile(path);
            } catch (IOException exception) {
                log.error("Failed to ingest logs from {}", path, exception);
            }
        }
    }

    private void processFile(Path path) throws IOException {
        long pointer = fileOffsets.getOrDefault(path, 0L);

        try (RandomAccessFile file = new RandomAccessFile(path.toFile(), "r")) {
            long fileLength = file.length();
            if (fileLength < pointer) {
                pointer = 0L; // file rotated
            }

            file.seek(pointer);

            List<ObjectNode> buffer = new ArrayList<>();
            String line;
            while ((line = file.readLine()) != null) {
                String actualLine = new String(line.getBytes(StandardCharsets.ISO_8859_1), StandardCharsets.UTF_8);
                Optional<ObjectNode> document = parseLine(actualLine, path);
                document.ifPresent(buffer::add);

                if (buffer.size() >= ingestionProperties.getBulkSize()) {
                    sendBulk(buffer);
                    buffer.clear();
                }
            }

            if (!buffer.isEmpty()) {
                sendBulk(buffer);
            }

            fileOffsets.put(path, file.getFilePointer());
        }
    }

    private Optional<ObjectNode> parseLine(String line, Path source) {
        String trimmed = line.trim();
        if (trimmed.isEmpty()) {
            return Optional.empty();
        }

        Instant parsedTimestamp = null;
        String levelCandidate = null;
        String message = trimmed;

        int firstSpace = trimmed.indexOf(' ');
        if (firstSpace > 0) {
            String potentialTimestamp = trimmed.substring(0, firstSpace).replace('[', ' ').replace(']', ' ').trim();
            Instant timestamp = tryParseInstant(potentialTimestamp);
            if (timestamp != null) {
                parsedTimestamp = timestamp;
                message = trimmed.substring(firstSpace + 1).trim();
            }
        }

        if (message.startsWith("[")) {
            int closing = message.indexOf(']');
            if (closing > 0) {
                levelCandidate = message.substring(1, closing).trim();
                message = message.substring(closing + 1).trim();
            }
        } else {
            int secondSpace = message.indexOf(' ');
            if (secondSpace > 0) {
                String potentialLevel = message.substring(0, secondSpace);
                if (potentialLevel.chars().allMatch(Character::isLetter)) {
                    levelCandidate = potentialLevel.toUpperCase(Locale.ROOT);
                    message = message.substring(secondSpace + 1).trim();
                }
            }
        }

        Instant timestamp = parsedTimestamp != null ? parsedTimestamp : Instant.now();

        ObjectNode document = objectMapper.createObjectNode();
        document.put("timestamp", timestamp.toString());
        if (levelCandidate != null) {
            document.put("level", levelCandidate.toUpperCase(Locale.ROOT));
        }
        document.put("message", message);
        document.put("raw", line);
        document.put("source", source.toString());
        return Optional.of(document);
    }

    private Instant tryParseInstant(String candidate) {
        if (candidate == null || candidate.isEmpty()) {
            return null;
        }
        for (DateTimeFormatter formatter : TIMESTAMP_FORMATS) {
            try {
                if (formatter == DateTimeFormatter.ISO_LOCAL_DATE_TIME) {
                    LocalDateTime localDateTime = LocalDateTime.parse(candidate, formatter);
                    return localDateTime.atZone(ZoneId.systemDefault()).toInstant();
                } else if (formatter == DateTimeFormatter.ISO_INSTANT) {
                    return Instant.parse(candidate);
                }
                return OffsetDateTime.parse(candidate, formatter).toInstant();
            } catch (DateTimeParseException ignored) {
                // try the next formatter
            }
        }
        return null;
    }

    private void sendBulk(List<ObjectNode> documents) {
        if (documents.isEmpty()) {
            return;
        }

        String index = elasticsearchProperties.getIndex();
        StringBuilder payload = new StringBuilder();

        for (ObjectNode document : documents) {
            ObjectNode indexInstruction = objectMapper.createObjectNode();
            ObjectNode indexDetails = objectMapper.createObjectNode();
            indexDetails.put("_index", index);
            indexInstruction.set("index", indexDetails);

            payload.append(indexInstruction.toString()).append('\n');
            payload.append(document.toString()).append('\n');
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_NDJSON);

        try {
            elasticsearchRestTemplate.postForEntity(
                    "/_bulk?refresh=false",
                    new HttpEntity<>(payload.toString(), headers),
                    String.class);
        } catch (RestClientException exception) {
            log.error("Failed to ship log batch to Elasticsearch", exception);
        }
    }
}