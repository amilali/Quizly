package com.quizly.backend.model;

import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Column;

import java.util.List;

@Entity
@Table(name = "questions")
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String stem;
    
    private String stack;
    private String topic;
    private String difficulty;
    private String status;

    @ElementCollection
    private List<String> options;

    private Integer correctOption;
    private String creatorId;
    private String reviewerId;

    public Question() {}

    public Question(Long id, String stem, String stack, String topic, String difficulty, String status, List<String> options, Integer correctOption, String creatorId, String reviewerId) {
        this.id = id;
        this.stem = stem;
        this.stack = stack;
        this.topic = topic;
        this.difficulty = difficulty;
        this.status = status;
        this.options = options;
        this.correctOption = correctOption;
        this.creatorId = creatorId;
        this.reviewerId = reviewerId;
    }

    public static QuestionBuilder builder() {
        return new QuestionBuilder();
    }

    public static class QuestionBuilder {
        private Long id;
        private String stem;
        private String stack;
        private String topic;
        private String difficulty;
        private String status;
        private List<String> options;
        private Integer correctOption;
        private String creatorId;
        private String reviewerId;

        public QuestionBuilder id(Long id) { this.id = id; return this; }
        public QuestionBuilder stem(String stem) { this.stem = stem; return this; }
        public QuestionBuilder stack(String stack) { this.stack = stack; return this; }
        public QuestionBuilder topic(String topic) { this.topic = topic; return this; }
        public QuestionBuilder difficulty(String difficulty) { this.difficulty = difficulty; return this; }
        public QuestionBuilder status(String status) { this.status = status; return this; }
        public QuestionBuilder options(List<String> options) { this.options = options; return this; }
        public QuestionBuilder correctOption(Integer correctOption) { this.correctOption = correctOption; return this; }
        public QuestionBuilder creatorId(String creatorId) { this.creatorId = creatorId; return this; }
        public QuestionBuilder reviewerId(String reviewerId) { this.reviewerId = reviewerId; return this; }
        public Question build() { return new Question(id, stem, stack, topic, difficulty, status, options, correctOption, creatorId, reviewerId); }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getStem() { return stem; }
    public void setStem(String stem) { this.stem = stem; }
    public String getStack() { return stack; }
    public void setStack(String stack) { this.stack = stack; }
    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }
    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public List<String> getOptions() { return options; }
    public void setOptions(List<String> options) { this.options = options; }
    public Integer getCorrectOption() { return correctOption; }
    public void setCorrectOption(Integer correctOption) { this.correctOption = correctOption; }
    public String getCreatorId() { return creatorId; }
    public void setCreatorId(String creatorId) { this.creatorId = creatorId; }
    public String getReviewerId() { return reviewerId; }
    public void setReviewerId(String reviewerId) { this.reviewerId = reviewerId; }
}
