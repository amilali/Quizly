package com.quizly.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Arrays;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Free sentence embeddings via Hugging Face Inference API.
 * Uses all-MiniLM-L6-v2 — a 22M param model that produces 384-dim embeddings.
 * Free tier: no credit card, ~1000 requests/day.
 *
 * Used for semantic duplicate detection (cosine similarity in memory).
 */
@Service
public class EmbeddingService {

    private static final String HF_API_URL =
        "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2";

    @Value("${HUGGINGFACE_API_KEY:}")
    private String hfApiKey;

    private final HttpClient httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(10))
        .build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Get a 384-dimensional embedding for a piece of text.
     * Falls back to null if HF API key not configured or API unreachable.
     */
    public float[] embed(String text) {
        if (hfApiKey == null || hfApiKey.isBlank()) {
            return null; // Not configured — caller falls back to text search
        }
        try {
            String body = objectMapper.writeValueAsString(new HfRequest(text));
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(HF_API_URL))
                .header("Authorization", "Bearer " + hfApiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .timeout(Duration.ofSeconds(30))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                // HF returns List<List<Float>> for feature-extraction models
                float[][] vectors = objectMapper.readValue(response.body(), float[][].class);
                if (vectors != null && vectors.length > 0) {
                    return vectors[0];
                }
            } else {
                System.err.println("HF Embedding API error " + response.statusCode() + ": " + response.body());
            }
        } catch (Exception e) {
            System.err.println("Embedding failed (falling back to text search): " + e.getMessage());
        }
        return null;
    }

    /**
     * Cosine similarity between two embedding vectors.
     */
    public double cosineSimilarity(float[] a, float[] b) {
        if (a == null || b == null || a.length != b.length) return 0.0;
        double dot = 0, normA = 0, normB = 0;
        for (int i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        return (normA == 0 || normB == 0) ? 0.0 : dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    // ── HF request DTO ────────────────────────────────────────────────────────
    record HfRequest(@JsonProperty("inputs") String inputs) {}
}
