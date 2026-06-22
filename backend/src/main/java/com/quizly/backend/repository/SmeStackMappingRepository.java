package com.quizly.backend.repository;

import com.quizly.backend.model.SmeStackMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SmeStackMappingRepository extends JpaRepository<SmeStackMapping, Long> {
    List<SmeStackMapping> findByStackName(String name);
}
