package com.quizly.backend.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "game_answers")
public class GameAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "pin")
    private String pin;

    @Column(name = "player_name")
    private String playerName;

    @Column(name = "question_id")
    private Long questionId;

    @Column(name = "question_stem", columnDefinition = "TEXT")
    private String questionStem;

    @Column(name = "question_stack")
    private String questionStack;

    @Column(name = "question_topic")
    private String questionTopic;

    @Column(name = "selected_option")
    private Integer selectedOption;

    @Column(name = "is_correct")
    private Boolean correct;

    @Column(name = "points_awarded")
    private Integer pointsAwarded;

    @Column(name = "time_taken_ms")
    private Long timeTakenMs;

    @Column(name = "answered_at")
    private Instant answeredAt;

    public GameAnswer() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getPin() { return pin; }
    public void setPin(String pin) { this.pin = pin; }

    public String getPlayerName() { return playerName; }
    public void setPlayerName(String playerName) { this.playerName = playerName; }

    public Long getQuestionId() { return questionId; }
    public void setQuestionId(Long questionId) { this.questionId = questionId; }

    public String getQuestionStem() { return questionStem; }
    public void setQuestionStem(String questionStem) { this.questionStem = questionStem; }

    public String getQuestionStack() { return questionStack; }
    public void setQuestionStack(String questionStack) { this.questionStack = questionStack; }

    public String getQuestionTopic() { return questionTopic; }
    public void setQuestionTopic(String questionTopic) { this.questionTopic = questionTopic; }

    public Integer getSelectedOption() { return selectedOption; }
    public void setSelectedOption(Integer selectedOption) { this.selectedOption = selectedOption; }

    public Boolean getCorrect() { return correct; }
    public void setCorrect(Boolean correct) { this.correct = correct; }

    public Integer getPointsAwarded() { return pointsAwarded; }
    public void setPointsAwarded(Integer pointsAwarded) { this.pointsAwarded = pointsAwarded; }

    public Long getTimeTakenMs() { return timeTakenMs; }
    public void setTimeTakenMs(Long timeTakenMs) { this.timeTakenMs = timeTakenMs; }

    public Instant getAnsweredAt() { return answeredAt; }
    public void setAnsweredAt(Instant answeredAt) { this.answeredAt = answeredAt; }
}
