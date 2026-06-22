package com.quizly.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "quiz_events")
public class QuizEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String status; // "Draft", "Published"
    private String hostId;
    private LocalDateTime createdAt;
    private long timeLimitSeconds;
    
    private String pin; // Generated on publish

    @OneToMany(mappedBy = "quizEvent", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EventQuestion> questions = new ArrayList<>();

    public QuizEvent() {}

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) this.status = "Draft";
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getHostId() { return hostId; }
    public void setHostId(String hostId) { this.hostId = hostId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public long getTimeLimitSeconds() { return timeLimitSeconds; }
    public void setTimeLimitSeconds(long timeLimitSeconds) { this.timeLimitSeconds = timeLimitSeconds; }
    public String getPin() { return pin; }
    public void setPin(String pin) { this.pin = pin; }
    public List<EventQuestion> getQuestions() { return questions; }
    public void setQuestions(List<EventQuestion> questions) { this.questions = questions; }
}
