package com.quizly.backend.controller;

import com.quizly.backend.model.User;
import com.quizly.backend.model.Role;
import com.quizly.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/smes")
    public ResponseEntity<List<User>> getSmes() {
        List<User> smes = userRepository.findAll().stream()
                .filter(user -> Role.SME.equals(user.getRole()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(smes);
    }

    @PostMapping("/smes")
    public ResponseEntity<User> createSme(@RequestBody User request) {
        if (userRepository.findByUserId(request.getUserId()).isPresent()) {
            return ResponseEntity.badRequest().build();
        }
        User sme = User.builder()
                .userId(request.getUserId())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.SME)
                .build();
        return ResponseEntity.ok(userRepository.save(sme));
    }
}
