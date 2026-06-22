package com.quizly.backend.controller;

import com.quizly.backend.model.EventQuestion;
import com.quizly.backend.model.QuizEvent;
import com.quizly.backend.service.QuizEventService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/events")
public class QuizEventController {

    private final QuizEventService quizEventService;

    public QuizEventController(QuizEventService quizEventService) {
        this.quizEventService = quizEventService;
    }

    @GetMapping
    public ResponseEntity<List<QuizEvent>> getEvents(Principal principal) {
        String hostId = principal != null ? principal.getName() : "anonymous";
        return ResponseEntity.ok(quizEventService.getEventsByHost(hostId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuizEvent> getEvent(@PathVariable Long id) {
        return ResponseEntity.ok(quizEventService.getEvent(id));
    }

    @PostMapping
    public ResponseEntity<QuizEvent> createEvent(@RequestBody Map<String, Object> req, Principal principal) {
        String hostId = principal != null ? principal.getName() : "anonymous";
        String name = (String) req.getOrDefault("name", "Untitled Event");
        long timeLimit = req.containsKey("timeLimitSeconds") ? ((Number) req.get("timeLimitSeconds")).longValue() : 30;
        return ResponseEntity.ok(quizEventService.createEvent(name, timeLimit, hostId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<QuizEvent> updateEvent(@PathVariable Long id, @RequestBody Map<String, Object> req) {
        String name = (String) req.getOrDefault("name", "Untitled Event");
        long timeLimit = req.containsKey("timeLimitSeconds") ? ((Number) req.get("timeLimitSeconds")).longValue() : 30;
        return ResponseEntity.ok(quizEventService.updateEvent(id, name, timeLimit));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEvent(@PathVariable Long id) {
        quizEventService.deleteEvent(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/questions/auto-pull")
    public ResponseEntity<QuizEvent> autoPullQuestions(@PathVariable Long id, @RequestBody Map<String, Object> req) {
        String stack = (String) req.getOrDefault("stack", "");
        String topic = (String) req.getOrDefault("topic", "");
        int count = req.containsKey("questionCount") ? ((Number) req.get("questionCount")).intValue() : 10;
        return ResponseEntity.ok(quizEventService.autoPullQuestions(id, stack, topic, count));
    }

    @PostMapping("/{id}/questions")
    public ResponseEntity<EventQuestion> addQuestion(@PathVariable Long id, @RequestBody EventQuestion question) {
        return ResponseEntity.ok(quizEventService.addQuestion(id, question));
    }

    @PutMapping("/{id}/questions/{questionId}")
    public ResponseEntity<EventQuestion> updateQuestion(@PathVariable Long id, @PathVariable Long questionId, @RequestBody EventQuestion question) {
        return ResponseEntity.ok(quizEventService.updateQuestion(id, questionId, question));
    }

    @DeleteMapping("/{id}/questions/{questionId}")
    public ResponseEntity<?> deleteQuestion(@PathVariable Long id, @PathVariable Long questionId) {
        quizEventService.deleteQuestion(id, questionId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/publish")
    public ResponseEntity<QuizEvent> publishEvent(@PathVariable Long id) {
        return ResponseEntity.ok(quizEventService.publishEvent(id));
    }

    @PutMapping("/{id}/unpublish")
    public ResponseEntity<QuizEvent> unpublishEvent(@PathVariable Long id) {
        return ResponseEntity.ok(quizEventService.unpublishEvent(id));
    }

    @PostMapping("/{id}/start-session")
    public ResponseEntity<QuizEvent> startSession(@PathVariable Long id) {
        return ResponseEntity.ok(quizEventService.startSession(id));
    }

    @PostMapping("/{id}/stop-session")
    public ResponseEntity<QuizEvent> stopSession(@PathVariable Long id) {
        return ResponseEntity.ok(quizEventService.stopSession(id));
    }
}
