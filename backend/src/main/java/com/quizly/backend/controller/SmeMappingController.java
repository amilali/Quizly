package com.quizly.backend.controller;

import com.quizly.backend.model.SmeStackMapping;
import com.quizly.backend.repository.SmeStackMappingRepository;
import com.quizly.backend.repository.StackRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/sme-mappings")
public class SmeMappingController {

    private final SmeStackMappingRepository smeStackMappingRepository;
    private final StackRepository stackRepository;

    public SmeMappingController(SmeStackMappingRepository smeStackMappingRepository, StackRepository stackRepository) {
        this.smeStackMappingRepository = smeStackMappingRepository;
        this.stackRepository = stackRepository;
    }

    @GetMapping
    public ResponseEntity<List<SmeStackMapping>> getAllMappings() {
        return ResponseEntity.ok(smeStackMappingRepository.findAll());
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

    @PostMapping
    public ResponseEntity<SmeStackMapping> createMapping(
            @RequestBody com.quizly.backend.dto.SmeMappingRequest request) {
        com.quizly.backend.model.Stack stack = stackRepository.findById(request.getStackId())
                .orElseThrow(() -> new RuntimeException("Stack not found"));
        SmeStackMapping mapping = new SmeStackMapping(request.getEnterpriseId(), stack);
        return ResponseEntity.ok(smeStackMappingRepository.save(mapping));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMapping(@PathVariable Long id) {
        smeStackMappingRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
