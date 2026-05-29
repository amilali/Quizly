package com.quizly.backend;

import com.quizly.backend.controller.SmeMappingController;
import com.quizly.backend.model.SmeStackMapping;
import com.quizly.backend.model.Stack;
import com.quizly.backend.repository.SmeStackMappingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;

class SmeMappingControllerTest {

    @Mock
    private SmeStackMappingRepository smeStackMappingRepository;

    @InjectMocks
    private SmeMappingController smeMappingController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testGetSmesForStack() {
        // Arrange
        String stackName = "Spring Boot";
        Stack stack = new Stack(1002L, stackName);
        SmeStackMapping mapping1 = new SmeStackMapping("birendra.kumar.singh", stack);
        SmeStackMapping mapping2 = new SmeStackMapping("swati.avinash.nikam", stack);
        SmeStackMapping mapping3 = new SmeStackMapping("birendra.kumar.singh", stack); // duplicate to test distinct

        when(smeStackMappingRepository.findByStackName(stackName))
                .thenReturn(List.of(mapping1, mapping2, mapping3));

        // Act
        ResponseEntity<List<String>> response = smeMappingController.getSmesForStack(stackName);

        // Assert
        assertEquals(200, response.getStatusCode().value());
        List<String> smes = response.getBody();
        assertEquals(2, smes.size());
        assertTrue(smes.contains("birendra.kumar.singh"));
        assertTrue(smes.contains("swati.avinash.nikam"));
        verify(smeStackMappingRepository, times(1)).findByStackName(stackName);
    }
}
