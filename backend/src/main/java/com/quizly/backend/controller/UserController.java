package com.quizly.backend.controller;

import com.quizly.backend.model.User;
import com.quizly.backend.model.Role;
import com.quizly.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/smes")
    public ResponseEntity<List<User>> getSmes() {
        List<User> smes = userRepository.findAll().stream()
                .filter(user -> Role.SME.equals(user.getRole()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(smes);
    }
}
