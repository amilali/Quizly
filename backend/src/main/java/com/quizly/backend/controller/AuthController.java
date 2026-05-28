package com.quizly.backend.controller;

import com.quizly.backend.dto.AuthRequest;
import com.quizly.backend.dto.AuthResponse;
import com.quizly.backend.dto.RegisterRequest;
import com.quizly.backend.model.User;
import com.quizly.backend.repository.UserRepository;
import com.quizly.backend.security.JwtService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService, AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        if (userRepository.findByUserId(request.getUserId()).isPresent()) {
            return ResponseEntity.badRequest().build(); // User already exists
        }

        User user = User.builder()
                .userId(request.getUserId())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .build();
        
        userRepository.save(user);

        String jwtToken = jwtService.generateToken(user);
        return ResponseEntity.ok(AuthResponse.builder()
                .token(jwtToken)
                .userId(user.getUserId())
                .role(user.getRole().name())
                .build());
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUserId(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByUserId(request.getUserId()).orElseThrow();
        String jwtToken = jwtService.generateToken(user);
        
        return ResponseEntity.ok(AuthResponse.builder()
                .token(jwtToken)
                .userId(user.getUserId())
                .role(user.getRole().name())
                .build());
    }
}
