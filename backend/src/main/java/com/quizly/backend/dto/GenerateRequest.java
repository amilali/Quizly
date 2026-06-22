package com.quizly.backend.dto;

public class GenerateRequest {
    private String stack;
    private String topic;
    private String difficulty;
    private int count;
    private java.util.List<String> avoidStems;


    public GenerateRequest() {}

    public String getStack() {
        return stack;
    }

    public void setStack(String stack) {
        this.stack = stack;
    }

    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    public String getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(String difficulty) {
        this.difficulty = difficulty;
    }

    public java.util.List<String> getAvoidStems() {
        return avoidStems;
    }

    public void setAvoidStems(java.util.List<String> avoidStems) {
        this.avoidStems = avoidStems;
    }

    public int getCount() {
        return count;
    }

    public void setCount(int count) {
        this.count = count;
    }
}
