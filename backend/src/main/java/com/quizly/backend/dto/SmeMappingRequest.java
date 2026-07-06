package com.quizly.backend.dto;

public class SmeMappingRequest {
    private String enterpriseId;
    private Long stackId;

    public SmeMappingRequest() {}

    public SmeMappingRequest(String enterpriseId, Long stackId) {
        this.enterpriseId = enterpriseId;
        this.stackId = stackId;
    }

    public String getEnterpriseId() {
        return enterpriseId;
    }

    public void setEnterpriseId(String enterpriseId) {
        this.enterpriseId = enterpriseId;
    }

    public Long getStackId() {
        return stackId;
    }

    public void setStackId(Long stackId) {
        this.stackId = stackId;
    }
}
