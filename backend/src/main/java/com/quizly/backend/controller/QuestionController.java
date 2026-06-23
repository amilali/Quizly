package com.quizly.backend.controller;

import com.quizly.backend.model.Question;
import com.quizly.backend.model.Stack;
import com.quizly.backend.model.Topic;
import com.quizly.backend.repository.QuestionRepository;
import com.quizly.backend.repository.StackRepository;
import com.quizly.backend.repository.TopicRepository;
import org.springframework.http.HttpStatus;
import com.quizly.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.security.Principal;

@RestController
@RequestMapping("/api/questions")
public class QuestionController {

    private final QuestionRepository questionRepository;
    private final StackRepository stackRepository;
    private final TopicRepository topicRepository;
    private final UserRepository userRepository;
    private final com.quizly.backend.service.AiService aiService;

    public QuestionController(QuestionRepository questionRepository, StackRepository stackRepository, TopicRepository topicRepository, UserRepository userRepository, com.quizly.backend.service.AiService aiService) {
        this.questionRepository = questionRepository;
        this.stackRepository = stackRepository;
        this.topicRepository = topicRepository;
        this.userRepository = userRepository;
        this.aiService = aiService;
    }

    private void resolveStackAndTopic(Question question) {
        if (question.getStack() != null && !question.getStack().trim().isEmpty()) {
            Stack s = stackRepository.findByName(question.getStack()).orElseGet(() -> {
                try {
                    Stack newStack = new Stack();
                    newStack.setId(System.currentTimeMillis() / 1000 + (long) (Math.random() * 10000));
                    newStack.setName(question.getStack());
                    return stackRepository.save(newStack);
                } catch (Exception e) {
                    // Another question in same batch already created this stack — fetch it
                    return stackRepository.findByName(question.getStack()).orElseThrow();
                }
            });
            question.setStackEntity(s);
        }
        if (question.getTopic() != null && !question.getTopic().trim().isEmpty()) {
            Topic t = topicRepository.findByName(question.getTopic()).orElseGet(() -> {
                try {
                    Topic newTopic = new Topic();
                    newTopic.setId(System.currentTimeMillis() / 1000 + (long) (Math.random() * 10000));
                    newTopic.setName(question.getTopic());
                    newTopic.setStack(question.getStackEntity());
                    return topicRepository.save(newTopic);
                } catch (Exception e) {
                    return topicRepository.findByName(question.getTopic()).orElseThrow();
                }
            });
            question.setTopicEntity(t);
        }
    }

    @GetMapping
    public ResponseEntity<List<Question>> getAllQuestions(Principal principal) {
        if (principal == null) {
            return ResponseEntity.ok(List.of());
        }
        String username = principal.getName();
        return userRepository.findByUserId(username).map(user -> {
            if (user.getRole() == com.quizly.backend.model.Role.ADMIN) {
                return ResponseEntity.ok(questionRepository.findAll());
            } else {
                return ResponseEntity.ok(questionRepository.findByCreatorIdOrReviewerId(username, username));
            }
        }).orElse(ResponseEntity.ok(List.of()));
    }

    @PostMapping
    public ResponseEntity<?> createQuestion(@RequestBody Question question, @RequestParam(defaultValue = "false") boolean override, Principal principal) {
        if (principal != null) {
            question.setCreatorId(principal.getName());
        }
        
        if (!override) {
            // 1. Perform RAG Similarity Check
            com.quizly.backend.dto.DuplicateCheckResponse duplicateCheck = aiService.checkDuplication(question);
            if (duplicateCheck.isDuplicate()) {
                // Reject if >30% similarity found
                return ResponseEntity.status(HttpStatus.CONFLICT).body(duplicateCheck);
            }
        }

        resolveStackAndTopic(question);
        Question savedQuestion = questionRepository.save(question);
        aiService.syncQuestionToVectorStore(savedQuestion);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedQuestion);
    }

    @PostMapping("/bulk")
    public ResponseEntity<?> createQuestionsBulk(@RequestBody List<Question> questions, @RequestParam(defaultValue = "false") boolean override, Principal principal) {
        if (principal != null) {
            String creatorId = principal.getName();
            for (Question q : questions) {
                q.setCreatorId(creatorId);
                // Always clear ID for bulk create — never allow client-supplied IDs
                q.setId(null);
            }
        } else {
            // Still clear IDs even without principal
            questions.forEach(q -> q.setId(null));
        }

        List<Question> validQuestions = new java.util.ArrayList<>();
        List<java.util.Map<String, Object>> duplicateReports = new java.util.ArrayList<>();

        if (!override) {
            // Fast DB exact-match check only (no embedding API calls — safe and fast for bulk)
            for (Question q : questions) {
                if (q.getStem() != null && !q.getStem().isBlank()) {
                    java.util.List<Question> exactMatches = questionRepository.findByStemIgnoreCase(q.getStem().trim());
                    if (!exactMatches.isEmpty()) {
                        java.util.Map<String, Object> report = new java.util.HashMap<>();
                        report.put("question", q.getStem());
                        report.put("originalQuestion", q);
                        report.put("conflicts", exactMatches.stream().map(m -> {
                            java.util.Map<String, Object> c = new java.util.HashMap<>();
                            c.put("questionId", m.getId());
                            c.put("stem", m.getStem());
                            c.put("similarityPercentage", 100);
                            return c;
                        }).collect(java.util.stream.Collectors.toList()));
                        duplicateReports.add(report);
                        continue;
                    }
                }
                resolveStackAndTopic(q);
                validQuestions.add(q);
            }
        } else {
            for (Question q : questions) {
                resolveStackAndTopic(q);
                validQuestions.add(q);
            }
        }

        if (!validQuestions.isEmpty()) {
            List<Question> savedQuestions = questionRepository.saveAll(validQuestions);
            // Fire-and-forget: sync to vector store asynchronously (does not block response)
            savedQuestions.forEach(aiService::syncQuestionToVectorStore);
        }

        if (!duplicateReports.isEmpty()) {
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("savedCount", validQuestions.size());
            response.put("duplicates", duplicateReports);
            return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(validQuestions);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Question> updateQuestion(@PathVariable Long id, @RequestBody Question question) {
        return questionRepository.findById(id).map(existingQuestion -> {
            if (question.getStem() != null) existingQuestion.setStem(question.getStem());
            if (question.getStack() != null) {
                existingQuestion.setStack(question.getStack());
            }
            if (question.getTopic() != null) {
                existingQuestion.setTopic(question.getTopic());
            }
            if (question.getDifficulty() != null) existingQuestion.setDifficulty(question.getDifficulty());
            if (question.getStatus() != null) existingQuestion.setStatus(question.getStatus());
            if (question.getOptions() != null) existingQuestion.setOptions(question.getOptions());
            if (question.getCorrectOption() != null) existingQuestion.setCorrectOption(question.getCorrectOption());
            if (question.getCreatorId() != null) existingQuestion.setCreatorId(question.getCreatorId());
            if (question.getReviewerId() != null) existingQuestion.setReviewerId(question.getReviewerId());
            
            resolveStackAndTopic(existingQuestion);
            Question updatedQuestion = questionRepository.save(existingQuestion);
            aiService.syncQuestionToVectorStore(updatedQuestion);
            return ResponseEntity.ok(updatedQuestion);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long id) {
        if (questionRepository.existsById(id)) {
            questionRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/generate-draft")
    public ResponseEntity<Question> generateDraftQuestion(@RequestBody com.quizly.backend.dto.GenerateRequest request) {
        List<Question> generated = aiService.generateQuestions(request, "draft");
        if (generated != null && !generated.isEmpty()) {
            return ResponseEntity.ok(generated.get(0));
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generateQuestions(@RequestBody com.quizly.backend.dto.GenerateRequest request, Principal principal) {
        String creatorId = principal != null ? principal.getName() : "system";
        List<Question> generated = aiService.generateQuestions(request, creatorId);
        
        List<Question> uniqueQuestions = new java.util.ArrayList<>();
        List<java.util.Map<String, Object>> duplicateReports = new java.util.ArrayList<>();
        
        // Discard any generated questions that are >30% similar to existing ones
        for (Question q : generated) {
            com.quizly.backend.dto.DuplicateCheckResponse duplicateCheck = aiService.checkDuplication(q);
            if (!duplicateCheck.isDuplicate()) {
                resolveStackAndTopic(q);
                uniqueQuestions.add(q);
            } else {
                java.util.Map<String, Object> report = new java.util.HashMap<>();
                report.put("generatedStem", q.getStem());
                report.put("originalQuestion", q);
                report.put("conflicts", duplicateCheck.getSimilarQuestions());
                duplicateReports.add(report);
            }
        }
        
        if (!uniqueQuestions.isEmpty()) {
            List<Question> savedQuestions = questionRepository.saveAll(uniqueQuestions);
            savedQuestions.forEach(aiService::syncQuestionToVectorStore);
            
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("saved", savedQuestions);
            response.put("discardedDuplicates", duplicateReports);
            response.put("requestedCount", request.getCount());
            response.put("generatedCount", savedQuestions.size());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } else {
            // All generated questions were duplicates
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("error", "Failed to generate some or all questions (they were either invalid or >30% similar to existing database questions).");
            response.put("discardedDuplicates", duplicateReports);
            response.put("requestedCount", request.getCount());
            response.put("generatedCount", 0);
            return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
        }
    }

    @PostMapping("/duplicate-check")
    public ResponseEntity<com.quizly.backend.dto.DuplicateCheckResponse> checkDuplication(@RequestBody Question question) {
        return ResponseEntity.ok(aiService.checkDuplication(question));
    }
}
