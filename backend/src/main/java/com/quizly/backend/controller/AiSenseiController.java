package com.quizly.backend.controller;

import com.quizly.backend.service.AiSenseiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.List;
import java.util.Collections;

@RestController
@RequestMapping("/api/sensei")
public class AiSenseiController {

    private final AiSenseiService aiSenseiService;

    public AiSenseiController(AiSenseiService aiSenseiService) {
        this.aiSenseiService = aiSenseiService;
    }

    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chat(@RequestBody Map<String, Object> request) {
        String message = (String) request.get("message");
        String mode = (String) request.getOrDefault("mode", "think");
        
        @SuppressWarnings("unchecked")
        List<String> mcpServers = (List<String>) request.getOrDefault("mcpServers", Collections.emptyList());
        
        if (message == null || message.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Message cannot be empty"));
        }
        
        String response = aiSenseiService.chat(message, mode, mcpServers);
        return ResponseEntity.ok(Map.of("response", response));
    }

    @PostMapping("/chat-with-file")
    public ResponseEntity<Map<String, String>> chatWithFile(
            @RequestParam("message") String message,
            @RequestParam(value = "mode", defaultValue = "think") String mode,
            @RequestParam(value = "mcpServers", required = false) List<String> mcpServers,
            @RequestParam("file") MultipartFile file) {
        
        if (message == null || message.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Message cannot be empty"));
        }
        
        if (mcpServers == null) {
            mcpServers = Collections.emptyList();
        }
        
        try {
            String fileContent = new String(file.getBytes());
            String fileName = file.getOriginalFilename();
            String enrichedMessage = message + "\n\n--- Attached File: " + fileName + " ---\n" + fileContent;
            
            String response = aiSenseiService.chat(enrichedMessage, mode, mcpServers);
            return ResponseEntity.ok(Map.of("response", response));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to process file: " + e.getMessage()));
        }
    }
}
