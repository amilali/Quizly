package com.quizly.backend.dto;

import java.util.List;

public class DuplicateCheckResponse {
    private boolean isDuplicate;
    private double highestSimilarity;
    private List<SimilarQuestionInfo> similarQuestions;

    public DuplicateCheckResponse() {}

    public boolean isDuplicate() {
        return isDuplicate;
    }

    public void setDuplicate(boolean duplicate) {
        isDuplicate = duplicate;
    }

    public double getHighestSimilarity() {
        return highestSimilarity;
    }

    public void setHighestSimilarity(double highestSimilarity) {
        this.highestSimilarity = highestSimilarity;
    }

    public List<SimilarQuestionInfo> getSimilarQuestions() {
        return similarQuestions;
    }

    public void setSimilarQuestions(List<SimilarQuestionInfo> similarQuestions) {
        this.similarQuestions = similarQuestions;
    }

    public static class SimilarQuestionInfo {
        private Long questionId;
        private String stem;
        private int similarityPercentage;

        public SimilarQuestionInfo() {}

        public SimilarQuestionInfo(Long questionId, String stem, int similarityPercentage) {
            this.questionId = questionId;
            this.stem = stem;
            this.similarityPercentage = similarityPercentage;
        }

        public Long getQuestionId() {
            return questionId;
        }

        public void setQuestionId(Long questionId) {
            this.questionId = questionId;
        }

        public String getStem() {
            return stem;
        }

        public void setStem(String stem) {
            this.stem = stem;
        }

        public int getSimilarityPercentage() {
            return similarityPercentage;
        }

        public void setSimilarityPercentage(int similarityPercentage) {
            this.similarityPercentage = similarityPercentage;
        }
    }
}
