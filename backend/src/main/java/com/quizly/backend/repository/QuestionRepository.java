package com.quizly.backend.repository;

import com.quizly.backend.model.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByCreatorIdOrReviewerId(String creatorId, String reviewerId);
    List<Question> findByStackEntityNameIgnoreCaseAndTopicEntityNameIgnoreCase(String stackName, String topicName);
    List<Question> findByStemIgnoreCase(String stem);
}
