package com.quizly.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Transient;

import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "questions")
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String stem;

    @ManyToOne
    @JoinColumn(name = "stack_id")
    private Stack stackEntity;

    @ManyToOne
    @JoinColumn(name = "topic_id")
    private Topic topicEntity;

    private String difficulty;
    private String status;

    @Column(name = "option_a")
    private String optionA;

    @Column(name = "option_b")
    private String optionB;

    @Column(name = "option_c")
    private String optionC;

    @Column(name = "option_d")
    private String optionD;

    @Column(name = "correct_answer")
    private String correctAnswer;

    private String creatorId;
    private String reviewerId;

    @Transient
    private String stackName;

    @Transient
    private String topicName;

    public Question() {}

    public Question(Long id, String stem, Stack stackEntity, Topic topicEntity, String difficulty, String status, 
                    String optionA, String optionB, String optionC, String optionD, String correctAnswer, 
                    String creatorId, String reviewerId) {
        this.id = id;
        this.stem = stem;
        this.stackEntity = stackEntity;
        this.topicEntity = topicEntity;
        this.difficulty = difficulty;
        this.status = status;
        this.optionA = optionA;
        this.optionB = optionB;
        this.optionC = optionC;
        this.optionD = optionD;
        this.correctAnswer = correctAnswer;
        this.creatorId = creatorId;
        this.reviewerId = reviewerId;
    }

    public static QuestionBuilder builder() {
        return new QuestionBuilder();
    }

    public static class QuestionBuilder {
        private Long id;
        private String stem;
        private Stack stackEntity;
        private Topic topicEntity;
        private String stackName;
        private String topicName;
        private String difficulty;
        private String status;
        private String optionA;
        private String optionB;
        private String optionC;
        private String optionD;
        private String correctAnswer;
        private String creatorId;
        private String reviewerId;

        public QuestionBuilder id(Long id) { this.id = id; return this; }
        public QuestionBuilder stem(String stem) { this.stem = stem; return this; }
        public QuestionBuilder stackEntity(Stack stackEntity) { this.stackEntity = stackEntity; return this; }
        public QuestionBuilder topicEntity(Topic topicEntity) { this.topicEntity = topicEntity; return this; }
        public QuestionBuilder stack(String stack) { this.stackName = stack; return this; }
        public QuestionBuilder topic(String topic) { this.topicName = topic; return this; }
        public QuestionBuilder difficulty(String difficulty) { this.difficulty = difficulty; return this; }
        public QuestionBuilder status(String status) { this.status = status; return this; }
        public QuestionBuilder optionA(String optionA) { this.optionA = optionA; return this; }
        public QuestionBuilder optionB(String optionB) { this.optionB = optionB; return this; }
        public QuestionBuilder optionC(String optionC) { this.optionC = optionC; return this; }
        public QuestionBuilder optionD(String optionD) { this.optionD = optionD; return this; }
        public QuestionBuilder options(List<String> options) {
            if (options != null) {
                if (options.size() > 0) this.optionA = options.get(0);
                if (options.size() > 1) this.optionB = options.get(1);
                if (options.size() > 2) this.optionC = options.get(2);
                if (options.size() > 3) this.optionD = options.get(3);
            }
            return this;
        }
        public QuestionBuilder correctOption(Integer correctOption) {
            if (correctOption == null) this.correctAnswer = null;
            else if (correctOption == 0) this.correctAnswer = "A";
            else if (correctOption == 1) this.correctAnswer = "B";
            else if (correctOption == 2) this.correctAnswer = "C";
            else if (correctOption == 3) this.correctAnswer = "D";
            return this;
        }
        public QuestionBuilder correctAnswer(String correctAnswer) { this.correctAnswer = correctAnswer; return this; }
        public QuestionBuilder creatorId(String creatorId) { this.creatorId = creatorId; return this; }
        public QuestionBuilder reviewerId(String reviewerId) { this.reviewerId = reviewerId; return this; }

        public Question build() {
            Question q = new Question(id, stem, stackEntity, topicEntity, difficulty, status, optionA, optionB, optionC, optionD, correctAnswer, creatorId, reviewerId);
            if (stackName != null) q.setStack(stackName);
            if (topicName != null) q.setTopic(topicName);
            return q;
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getStem() { return stem; }
    public void setStem(String stem) { this.stem = stem; }

    public Stack getStackEntity() { return stackEntity; }
    public void setStackEntity(Stack stackEntity) { this.stackEntity = stackEntity; }
    public Topic getTopicEntity() { return topicEntity; }
    public void setTopicEntity(Topic topicEntity) { this.topicEntity = topicEntity; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getOptionA() { return optionA; }
    public void setOptionA(String optionA) { this.optionA = optionA; }
    public String getOptionB() { return optionB; }
    public void setOptionB(String optionB) { this.optionB = optionB; }
    public String getOptionC() { return optionC; }
    public void setOptionC(String optionC) { this.optionC = optionC; }
    public String getOptionD() { return optionD; }
    public void setOptionD(String optionD) { this.optionD = optionD; }

    public String getCorrectAnswer() { return correctAnswer; }
    public void setCorrectAnswer(String correctAnswer) { this.correctAnswer = correctAnswer; }

    public String getCreatorId() { return creatorId; }
    public void setCreatorId(String creatorId) { this.creatorId = creatorId; }
    public String getReviewerId() { return reviewerId; }
    public void setReviewerId(String reviewerId) { this.reviewerId = reviewerId; }

    // API Backward Compatibility getters and setters
    @Transient
    public List<String> getOptions() {
        List<String> list = new ArrayList<>();
        list.add(optionA != null ? optionA : "");
        list.add(optionB != null ? optionB : "");
        list.add(optionC != null ? optionC : "");
        list.add(optionD != null ? optionD : "");
        return list;
    }

    public void setOptions(List<String> options) {
        if (options != null) {
            if (options.size() > 0) this.optionA = options.get(0);
            if (options.size() > 1) this.optionB = options.get(1);
            if (options.size() > 2) this.optionC = options.get(2);
            if (options.size() > 3) this.optionD = options.get(3);
        }
    }

    @Transient
    public Integer getCorrectOption() {
        if ("A".equalsIgnoreCase(correctAnswer)) return 0;
        if ("B".equalsIgnoreCase(correctAnswer)) return 1;
        if ("C".equalsIgnoreCase(correctAnswer)) return 2;
        if ("D".equalsIgnoreCase(correctAnswer)) return 3;
        return null;
    }

    public void setCorrectOption(Integer correctOption) {
        if (correctOption == null) this.correctAnswer = null;
        else if (correctOption == 0) this.correctAnswer = "A";
        else if (correctOption == 1) this.correctAnswer = "B";
        else if (correctOption == 2) this.correctAnswer = "C";
        else if (correctOption == 3) this.correctAnswer = "D";
    }

    @Transient
    public String getStack() {
        return stackEntity != null ? stackEntity.getName() : stackName;
    }

    public void setStack(String stack) {
        this.stackName = stack;
    }

    @Transient
    public String getTopic() {
        return topicEntity != null ? topicEntity.getName() : topicName;
    }

    public void setTopic(String topic) {
        this.topicName = topic;
    }
}
