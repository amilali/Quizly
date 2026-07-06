package com.quizly.backend.controller;

import com.quizly.backend.model.Stack;
import com.quizly.backend.repository.StackRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/stacks")
public class StackController {

    private final StackRepository stackRepository;

    public StackController(StackRepository stackRepository) {
        this.stackRepository = stackRepository;
    }

    @GetMapping
    public ResponseEntity<List<Stack>> getAllStacks() {
        return ResponseEntity.ok(stackRepository.findAll());
    }

    @org.springframework.web.bind.annotation.PostMapping
    public ResponseEntity<Stack> createStack(@org.springframework.web.bind.annotation.RequestBody Stack stack) {
        return ResponseEntity.ok(stackRepository.save(stack));
    }
}
