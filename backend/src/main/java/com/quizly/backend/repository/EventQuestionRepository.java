package com.quizly.backend.repository;

import com.quizly.backend.model.EventQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EventQuestionRepository extends JpaRepository<EventQuestion, Long> {
}
