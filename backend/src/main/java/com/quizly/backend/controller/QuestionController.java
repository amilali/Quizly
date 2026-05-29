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

    public QuestionController(QuestionRepository questionRepository, StackRepository stackRepository, TopicRepository topicRepository, UserRepository userRepository) {
        this.questionRepository = questionRepository;
        this.stackRepository = stackRepository;
        this.topicRepository = topicRepository;
        this.userRepository = userRepository;
    }

    private void resolveStackAndTopic(Question question) {
        if (question.getStack() != null && !question.getStack().trim().isEmpty()) {
            Stack s = stackRepository.findByName(question.getStack())
                    .orElseGet(() -> {
                        Stack newStack = new Stack();
                        newStack.setId(System.currentTimeMillis() / 1000 + (long) (Math.random() * 10000));
                        newStack.setName(question.getStack());
                        return stackRepository.save(newStack);
                    });
            question.setStackEntity(s);
        }
        if (question.getTopic() != null && !question.getTopic().trim().isEmpty()) {
            Topic t = topicRepository.findByName(question.getTopic())
                    .orElseGet(() -> {
                        Topic newTopic = new Topic();
                        newTopic.setId(System.currentTimeMillis() / 1000 + (long) (Math.random() * 10000));
                        newTopic.setName(question.getTopic());
                        newTopic.setStack(question.getStackEntity());
                        return topicRepository.save(newTopic);
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
    public ResponseEntity<Question> createQuestion(@RequestBody Question question, Principal principal) {
        if (principal != null) {
            question.setCreatorId(principal.getName());
        }
        resolveStackAndTopic(question);
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
        for (Question q : questions) {
            resolveStackAndTopic(q);
        }
        List<Question> savedQuestions = questionRepository.saveAll(questions);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedQuestions);
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
            return ResponseEntity.ok(updatedQuestion);
        }).orElse(ResponseEntity.notFound().build());
    }
}
