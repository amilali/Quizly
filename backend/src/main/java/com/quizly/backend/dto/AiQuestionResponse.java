package com.quizly.backend.dto;

import java.util.List;

public class AiQuestionResponse {
    private String stem;
    private List<String> options;
    private int correctOption;

    public AiQuestionResponse() {}

    public String getStem() { return stem; }
    public void setStem(String stem) { this.stem = stem; }
    
    public List<String> getOptions() { return options; }
    public void setOptions(List<String> options) { this.options = options; }
    
    public int getCorrectOption() { return correctOption; }
    public void setCorrectOption(int correctOption) { this.correctOption = correctOption; }
}
