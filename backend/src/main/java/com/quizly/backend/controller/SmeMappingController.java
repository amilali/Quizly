package com.quizly.backend.controller;

import com.quizly.backend.model.SmeStackMapping;
import com.quizly.backend.repository.SmeStackMappingRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/sme-mappings")
public class SmeMappingController {

    private final SmeStackMappingRepository smeStackMappingRepository;

    public SmeMappingController(SmeStackMappingRepository smeStackMappingRepository) {
        this.smeStackMappingRepository = smeStackMappingRepository;
    }

    @GetMapping("/smes")
    public ResponseEntity<List<String>> getSmesForStack(@RequestParam String stackName) {
        List<SmeStackMapping> mappings = smeStackMappingRepository.findByStackName(stackName);
        List<String> smes = mappings.stream()
                .map(SmeStackMapping::getEnterpriseId)
                .distinct()
                .collect(Collectors.toList());
        return ResponseEntity.ok(smes);
    }
}
