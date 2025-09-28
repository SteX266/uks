package com.example.dockerhub_clone.analytics;

import com.example.dockerhub_clone.dto.LogSearchHitDto;
import com.example.dockerhub_clone.dto.LogSearchRequest;
import com.example.dockerhub_clone.dto.LogSearchResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_GATEWAY;
import static org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

    private final RestTemplate elasticsearchRestTemplate;
    private final ElasticsearchProperties elasticsearchProperties;
    private final LogQueryParser logQueryParser;
    private final ObjectMapper objectMapper;

    public LogSearchResponse search(LogSearchRequest request) {
        if (!elasticsearchProperties.isEnabled() || !elasticsearchProperties.isSearchEnabled()) {
            System.out.println("NOT AVAILABLEEEE");
            throw new ResponseStatusException(
                    SERVICE_UNAVAILABLE,
                    "Analytics search is disabled. Enable analytics.elasticsearch.enabled to use this feature.");
        }

        LogQueryParser.ParseResult parsed = logQueryParser.parse(request.getQuery());

        ObjectNode payload = objectMapper.createObjectNode();
        payload.set("query", buildQueryNode(parsed.queryString()));
        payload.put("from", request.resolveFrom());
        payload.put("size", request.resolveSize());

        ArrayNode sort = objectMapper.createArrayNode();
        sort.add(objectMapper.createObjectNode().put("_score", "desc"));
        sort.add(objectMapper.createObjectNode().put("timestamp", "desc"));
        payload.set("sort", sort);

        ObjectNode highlight = objectMapper.createObjectNode();
        ObjectNode fields = objectMapper.createObjectNode();
        fields.set("message", objectMapper.createObjectNode());
        fields.set("raw", objectMapper.createObjectNode());
        highlight.set("fields", fields);
        payload.set("highlight", highlight);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            ResponseEntity<JsonNode> response = elasticsearchRestTemplate.postForEntity(
                    "/" + elasticsearchProperties.getIndex() + "/_search",
                    new HttpEntity<>(payload, headers),
                    JsonNode.class);

            JsonNode body = response.getBody();
            if (body == null) {
                throw new ResponseStatusException(BAD_GATEWAY, "Elasticsearch returned an empty response");
            }

            List<LogSearchHitDto> hits = new ArrayList<>();
            JsonNode hitsNode = body.path("hits").path("hits");
            if (hitsNode.isArray()) {
                for (JsonNode hitNode : hitsNode) {
                    hits.add(mapHit(hitNode));
                }
            }

            long total = body.path("hits").path("total").path("value").asLong(0L);
            int took = body.path("took").asInt(0);

            return LogSearchResponse.builder()
                    .hits(hits)
                    .total(total)
                    .took(took)
                    .translatedQuery(parsed.queryString())
                    .build();
        } catch (RestClientException exception) {
            log.error("Failed to execute analytics search", exception);
            throw new ResponseStatusException(
                    BAD_GATEWAY,
                    "Failed to execute search against Elasticsearch: " + exception.getMessage());
        }
    }

    private ObjectNode buildQueryNode(String query) {
        ObjectNode queryNode = objectMapper.createObjectNode();
        ObjectNode queryStringNode = objectMapper.createObjectNode();
        queryStringNode.put("query", query);
        queryStringNode.put("default_operator", "AND");
        queryNode.set("query_string", queryStringNode);
        return queryNode;
    }

    private LogSearchHitDto mapHit(JsonNode hitNode) {
        JsonNode source = hitNode.path("_source");
        JsonNode highlightNode = hitNode.path("highlight");
        String highlight = null;
        if (highlightNode.isObject()) {
            JsonNode messageHighlights = highlightNode.path("message");
            if (messageHighlights.isArray() && messageHighlights.size() > 0) {
                highlight = messageHighlights.get(0).asText();
            } else {
                JsonNode rawHighlights = highlightNode.path("raw");
                if (rawHighlights.isArray() && rawHighlights.size() > 0) {
                    highlight = rawHighlights.get(0).asText();
                }
            }
        }

        return LogSearchHitDto.builder()
                .id(hitNode.path("_id").asText(null))
                .score(hitNode.path("_score").doubleValue())
                .timestamp(source.path("timestamp").asText(null))
                .level(source.path("level").asText(null))
                .message(source.path("message").asText(null))
                .raw(source.path("raw").asText(null))
                .source(source.path("source").asText(null))
                .highlight(highlight)
                .build();
    }
}