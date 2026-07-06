package com.quizly.backend.tool;

import dev.langchain4j.agent.tool.Tool;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class WebSearchTool {

    private final HttpClient httpClient;

    public WebSearchTool() {
        this.httpClient = HttpClient.newBuilder()
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
    }

    @Tool("Searches the web for current information, news, or facts. Returns a brief snippet of search results.")
    public String searchWeb(String query) {
        try {
            String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8.toString());
            // Using a simple html endpoint for DuckDuckGo (lite)
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://lite.duckduckgo.com/lite/"))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
                    .POST(HttpRequest.BodyPublishers.ofString("q=" + encodedQuery))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            String html = response.body();

            // Very rudimentary parsing to extract some text snippets
            StringBuilder results = new StringBuilder();
            String[] lines = html.split("<tr");
            int count = 0;
            for (String line : lines) {
                if (line.contains("class=\"result-snippet\"")) {
                    String snippet = line.replaceAll("<[^>]*>", "").trim();
                    if (!snippet.isEmpty()) {
                        results.append("- ").append(snippet).append("\n");
                        count++;
                        if (count >= 3) break;
                    }
                }
            }

            if (results.length() == 0) {
                return "No useful search results found for: " + query;
            }
            return results.toString();
        } catch (Exception e) {
            return "Error performing web search: " + e.getMessage();
        }
    }
}
