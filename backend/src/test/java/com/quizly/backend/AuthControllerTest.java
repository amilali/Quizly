package com.quizly.backend;

import com.quizly.backend.controller.AuthController;
import com.quizly.backend.dto.AuthRequest;
import com.quizly.backend.dto.AuthResponse;
import com.quizly.backend.dto.RegisterRequest;
import com.quizly.backend.model.Role;
import com.quizly.backend.model.User;
import com.quizly.backend.repository.UserRepository;
import com.quizly.backend.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.*;

class AuthControllerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    private final JwtService jwtService = new JwtService(); // Real instance to avoid Java 26 Byte Buddy Mockito limits

    private AuthController authController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        authController = new AuthController(userRepository, passwordEncoder, jwtService, authenticationManager);
    }

    @Test
    void testRegisterUserSuccessfully() {
        // Arrange
        RegisterRequest request = new RegisterRequest();
        request.setUserId("new_user");
        request.setPassword("password123");
        request.setRole(Role.SME);

        when(userRepository.findByUserId("new_user")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");

        // Act
        ResponseEntity<AuthResponse> response = authController.register(request);

        // Assert
        assertEquals(200, response.getStatusCode().value());
        AuthResponse authResponse = response.getBody();
        assertNotNull(authResponse.getToken()); // Real token generated
        assertEquals("new_user", authResponse.getUserId());
        assertEquals("SME", authResponse.getRole());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void testRegisterUserAlreadyExists() {
        // Arrange
        RegisterRequest request = new RegisterRequest();
        request.setUserId("existing_user");
        request.setPassword("password123");
        request.setRole(Role.SME);

        when(userRepository.findByUserId("existing_user")).thenReturn(Optional.of(new User()));

        // Act
        ResponseEntity<AuthResponse> response = authController.register(request);

        // Assert
        assertEquals(400, response.getStatusCode().value());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void testLoginUserSuccessfully() {
        // Arrange
        AuthRequest request = new AuthRequest();
        request.setUserId("active_user");
        request.setPassword("password123");

        User user = new User(1L, "active_user", "encodedPassword", Role.ADMIN);
        when(userRepository.findByUserId("active_user")).thenReturn(Optional.of(user));

        // Act
        ResponseEntity<AuthResponse> response = authController.login(request);

        // Assert
        assertEquals(200, response.getStatusCode().value());
        AuthResponse authResponse = response.getBody();
        assertNotNull(authResponse.getToken()); // Real token generated
        assertEquals("active_user", authResponse.getUserId());
        assertEquals("ADMIN", authResponse.getRole());
        verify(authenticationManager, times(1)).authenticate(any());
    }
}
