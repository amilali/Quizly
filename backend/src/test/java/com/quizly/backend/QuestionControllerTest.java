package com.quizly.backend;

import com.quizly.backend.controller.QuestionController;
import com.quizly.backend.model.Question;
import com.quizly.backend.model.Role;
import com.quizly.backend.model.User;
import com.quizly.backend.repository.QuestionRepository;
import com.quizly.backend.repository.UserRepository;
import com.quizly.backend.repository.StackRepository;
import com.quizly.backend.repository.TopicRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.ResponseEntity;

import java.security.Principal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class QuestionControllerTest {

    @Mock
    private QuestionRepository questionRepository;

    @Mock
    private StackRepository stackRepository;

    @Mock
    private TopicRepository topicRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private QuestionController questionController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testGetAllQuestionsAsAdmin() {
        // Arrange
        String username = "admin.user";
        Principal principal = () -> username; // Lambda implementation of java.security.Principal

        User adminUser = new User(1L, username, "password", Role.ADMIN);
        when(userRepository.findByUserId(username)).thenReturn(Optional.of(adminUser));

        Question q1 = Question.builder().stem("Q1").creatorId("creator1").build();
        Question q2 = Question.builder().stem("Q2").creatorId("creator2").build();
        when(questionRepository.findAll()).thenReturn(List.of(q1, q2));

        // Act
        ResponseEntity<List<Question>> response = questionController.getAllQuestions(principal);

        // Assert
        assertEquals(200, response.getStatusCode().value());
        assertEquals(2, response.getBody().size());
        verify(questionRepository, times(1)).findAll();
        verify(questionRepository, never()).findByCreatorIdOrReviewerId(anyString(), anyString());
    }

    @Test
    void testGetAllQuestionsAsSme() {
        // Arrange
        String username = "sme.user";
        Principal principal = () -> username; // Lambda implementation of java.security.Principal

        User smeUser = new User(2L, username, "password", Role.SME);
        when(userRepository.findByUserId(username)).thenReturn(Optional.of(smeUser));

        Question q1 = Question.builder().stem("Q1").creatorId(username).build();
        when(questionRepository.findByCreatorIdOrReviewerId(username, username)).thenReturn(List.of(q1));

        // Act
        ResponseEntity<List<Question>> response = questionController.getAllQuestions(principal);

        // Assert
        assertEquals(200, response.getStatusCode().value());
        assertEquals(1, response.getBody().size());
        assertEquals("Q1", response.getBody().get(0).getStem());
        verify(questionRepository, never()).findAll();
        verify(questionRepository, times(1)).findByCreatorIdOrReviewerId(username, username);
    }
}
