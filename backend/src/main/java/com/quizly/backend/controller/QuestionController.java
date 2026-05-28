package com.quizly.backend.controller;

import com.quizly.backend.model.Question;
import com.quizly.backend.repository.QuestionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.security.Principal;

@RestController
@RequestMapping("/api/questions")
public class QuestionController {

    private final QuestionRepository questionRepository;

    public QuestionController(QuestionRepository questionRepository) {
        this.questionRepository = questionRepository;
    }

    @GetMapping
    public ResponseEntity<List<Question>> getAllQuestions() {
        return ResponseEntity.ok(questionRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<Question> createQuestion(@RequestBody Question question, Principal principal) {
        if (principal != null) {
            question.setCreatorId(principal.getName());
        }
        Question savedQuestion = questionRepository.save(question);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedQuestion);
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<Question>> createQuestionsBulk(@RequestBody List<Question> questions, Principal principal) {
        if (principal != null) {
            String creatorId = principal.getName();
            for (Question q : questions) {
                q.setCreatorId(creatorId);
            }
        }
        List<Question> savedQuestions = questionRepository.saveAll(questions);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedQuestions);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Question> updateQuestion(@PathVariable Long id, @RequestBody Question question) {
        return questionRepository.findById(id).map(existingQuestion -> {
            if (question.getStem() != null) existingQuestion.setStem(question.getStem());
            if (question.getStack() != null) existingQuestion.setStack(question.getStack());
            if (question.getTopic() != null) existingQuestion.setTopic(question.getTopic());
            if (question.getDifficulty() != null) existingQuestion.setDifficulty(question.getDifficulty());
            if (question.getStatus() != null) existingQuestion.setStatus(question.getStatus());
            if (question.getOptions() != null) existingQuestion.setOptions(question.getOptions());
            if (question.getCorrectOption() != null) existingQuestion.setCorrectOption(question.getCorrectOption());
            if (question.getCreatorId() != null) existingQuestion.setCreatorId(question.getCreatorId());
            if (question.getReviewerId() != null) existingQuestion.setReviewerId(question.getReviewerId());
            
            Question updatedQuestion = questionRepository.save(existingQuestion);
            return ResponseEntity.ok(updatedQuestion);
        }).orElse(ResponseEntity.notFound().build());
    }
}
