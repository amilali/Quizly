package com.quizly.backend.dto;

import java.util.List;

public class AiQuestionBatchResponse {
    private List<AiQuestionResponse> questions;

    public AiQuestionBatchResponse() {}

    public List<AiQuestionResponse> getQuestions() { return questions; }
    public void setQuestions(List<AiQuestionResponse> questions) { this.questions = questions; }
}
