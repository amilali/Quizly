package com.quizly.backend.repository;

import com.quizly.backend.model.Stack;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StackRepository extends JpaRepository<Stack, Long> {
    Optional<Stack> findByName(String name);
}
