package com.quizly.backend.dto;

public class AuthResponse {
    private String token;
    private String role;
    private String userId;

    public AuthResponse() {}
    public AuthResponse(String token, String role, String userId) {
        this.token = token;
        this.role = role;
        this.userId = userId;
    }

    public static AuthResponseBuilder builder() { return new AuthResponseBuilder(); }

    public static class AuthResponseBuilder {
        private String token;
        private String role;
        private String userId;
        public AuthResponseBuilder token(String token) { this.token = token; return this; }
        public AuthResponseBuilder role(String role) { this.role = role; return this; }
        public AuthResponseBuilder userId(String userId) { this.userId = userId; return this; }
        public AuthResponse build() { return new AuthResponse(token, role, userId); }
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
}
