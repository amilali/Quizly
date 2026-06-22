package com.quizly.backend.model;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class GameSession {

    public enum Status { WAITING, ACTIVE, SHOWING_ANSWER, ENDED }

    private String pin;
    private String hostId;
    private Status status;
    private int questionIndex;
    private List<Long> questionIds;
    // playerName -> score
    private Map<String, Integer> playerScores;
    // playerName -> answeredCurrentQuestion
    private Map<String, Boolean> answeredThisRound;
    // Time when current question was sent (epoch millis)
    private long questionStartTime;
    private long timeLimitMs;
    private boolean eventBased;

    public GameSession(String pin, String hostId, List<Long> questionIds, long timeLimitMs) {
        this.pin = pin;
        this.timeLimitMs = timeLimitMs;
        this.hostId = hostId;
        this.questionIds = questionIds;
        this.status = Status.WAITING;
        this.questionIndex = 0;
        this.playerScores = new ConcurrentHashMap<>();
        this.answeredThisRound = new ConcurrentHashMap<>();
    }

    public String getPin() { return pin; }
    public String getHostId() { return hostId; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public int getQuestionIndex() { return questionIndex; }
    public void incrementQuestionIndex() { this.questionIndex++; }
    public List<Long> getQuestionIds() { return questionIds; }
    public Map<String, Integer> getPlayerScores() { return playerScores; }
    public Map<String, Boolean> getAnsweredThisRound() { return answeredThisRound; }
    public long getQuestionStartTime() { return questionStartTime; }
    public void setQuestionStartTime(long questionStartTime) { this.questionStartTime = questionStartTime; }
    public long getTimeLimitMs() { return timeLimitMs; }
    public boolean isEventBased() { return eventBased; }
    public void setEventBased(boolean eventBased) { this.eventBased = eventBased; }

    public void addPlayer(String playerName) {
        playerScores.putIfAbsent(playerName, 0);
    }

    public void resetAnsweredThisRound() {
        answeredThisRound.replaceAll((k, v) -> false);
    }

    public boolean hasCurrentQuestion() {
        return questionIndex < questionIds.size();
    }

    public Long getCurrentQuestionId() {
        if (!hasCurrentQuestion()) return null;
        return questionIds.get(questionIndex);
    }

    public int getTotalQuestions() {
        return questionIds.size();
    }
}
