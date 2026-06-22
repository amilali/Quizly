package com.quizly.backend.repository;

import com.quizly.backend.model.QuizEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface QuizEventRepository extends JpaRepository<QuizEvent, Long> {
    List<QuizEvent> findByHostIdOrderByCreatedAtDesc(String hostId);
    Optional<QuizEvent> findByPin(String pin);
}
