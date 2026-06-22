package com.quizly.backend.controller;

import com.quizly.backend.service.GameService;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/api/game")
public class GameController {

    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @PostMapping("/create")
    @ResponseBody
    public ResponseEntity<?> createGame(@RequestBody Map<String, Object> request, Principal principal) {
        try {
            String hostId = principal != null ? principal.getName() : "anonymous";
            String stack = (String) request.getOrDefault("stack", "");
            String topic = (String) request.getOrDefault("topic", "");
            int questionCount = request.containsKey("questionCount")
                    ? ((Number) request.get("questionCount")).intValue()
                    : 10;
            long timeLimitMs = request.containsKey("timeLimitSeconds")
                    ? ((Number) request.get("timeLimitSeconds")).longValue() * 1000L
                    : 30000L;
            Map<String, Object> result = gameService.createGame(hostId, stack, topic, questionCount, timeLimitMs);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/join")
    @ResponseBody
    public ResponseEntity<?> joinGame(@RequestBody Map<String, String> request) {
        try {
            String pin = request.get("pin");
            String playerName = request.get("playerName");
            Map<String, Object> result = gameService.joinGame(pin, playerName);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/start")
    @ResponseBody
    public ResponseEntity<?> startGame(@RequestBody Map<String, String> request, Principal principal) {
        try {
            String pin = request.get("pin");
            gameService.startGame(pin);
            return ResponseEntity.ok(Map.of("status", "STARTED"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/show-answer")
    @ResponseBody
    public ResponseEntity<?> showAnswer(@RequestBody Map<String, String> request) {
        try {
            gameService.showAnswer(request.get("pin"));
            return ResponseEntity.ok(Map.of("status", "OK"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/next")
    @ResponseBody
    public ResponseEntity<?> nextQuestion(@RequestBody Map<String, String> request) {
        try {
            gameService.nextQuestion(request.get("pin"));
            return ResponseEntity.ok(Map.of("status", "OK"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{pin}/status")
    @ResponseBody
    public ResponseEntity<?> getGameStatus(@PathVariable String pin) {
        try {
            return ResponseEntity.ok(gameService.getGameStatus(pin));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{pin}/leaderboard")
    @ResponseBody
    public ResponseEntity<List<Map<String, Object>>> getLeaderboard(@PathVariable String pin) {
        try {
            return ResponseEntity.ok(gameService.getLeaderboard(pin));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // WebSocket message handler for player answers
    @MessageMapping("/game/answer")
    public void handleAnswer(@Payload Map<String, Object> payload) {
        String pin = (String) payload.get("pin");
        String playerName = (String) payload.get("playerName");
        Long questionId = Long.parseLong(payload.get("questionId").toString());
        int selectedOption = ((Number) payload.get("selectedOption")).intValue();
        gameService.submitAnswer(pin, playerName, questionId, selectedOption);
    }

    // Register WebSocket session for disconnect tracking
    @MessageMapping("/game/connect")
    public void handleConnect(@Payload Map<String, String> payload, SimpMessageHeaderAccessor headerAccessor) {
        String pin = payload.get("pin");
        String playerName = payload.get("playerName");
        String sessionId = headerAccessor.getSessionId();
        if (sessionId != null && pin != null && playerName != null) {
            gameService.registerSocketSession(sessionId, pin, playerName);
        }
    }
}
