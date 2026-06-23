package com.quizly.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "event_questions")
public class EventQuestion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String stem;
    private String optionA;
    private String optionB;
    private String optionC;
    private String optionD;
    private String correctAnswer; // "A", "B", "C", "D"
    private long timeLimitSeconds;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "quiz_event_id")
    @JsonIgnore
    private QuizEvent quizEvent;

    public EventQuestion() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getStem() { return stem; }
    public void setStem(String stem) { this.stem = stem; }
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
    public long getTimeLimitSeconds() { return timeLimitSeconds; }
    public void setTimeLimitSeconds(long timeLimitSeconds) { this.timeLimitSeconds = timeLimitSeconds; }
    public QuizEvent getQuizEvent() { return quizEvent; }
    public void setQuizEvent(QuizEvent quizEvent) { this.quizEvent = quizEvent; }
}
