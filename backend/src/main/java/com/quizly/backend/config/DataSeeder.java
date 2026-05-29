package com.quizly.backend.config;

import com.quizly.backend.model.*;
import com.quizly.backend.repository.*;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final QuestionRepository questionRepository;
    private final StackRepository stackRepository;
    private final TopicRepository topicRepository;
    private final SmeStackMappingRepository smeStackMappingRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository, 
                      QuestionRepository questionRepository, 
                      StackRepository stackRepository, 
                      TopicRepository topicRepository, 
                      SmeStackMappingRepository smeStackMappingRepository, 
                      PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.questionRepository = questionRepository;
        this.stackRepository = stackRepository;
        this.topicRepository = topicRepository;
        this.smeStackMappingRepository = smeStackMappingRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // 1. Seed Users
        if (userRepository.findByUserId("sme_user").isEmpty()) {
            userRepository.save(User.builder()
                    .userId("sme_user")
                    .password(passwordEncoder.encode("password123"))
                    .role(Role.SME)
                    .build());
        }

        if (userRepository.findByUserId("admin_user").isEmpty()) {
            userRepository.save(User.builder()
                    .userId("admin_user")
                    .password(passwordEncoder.encode("password123"))
                    .role(Role.ADMIN)
                    .build());
        }

        // 2. Seed Stacks (Image 14)
        if (stackRepository.count() == 0) {
            stackRepository.save(new Stack(1001L, "Spring Cloud"));
            stackRepository.save(new Stack(1002L, "Spring Boot"));
            stackRepository.save(new Stack(1003L, "Spring Core"));
            stackRepository.save(new Stack(1004L, "Spring MVC & REST"));
            stackRepository.save(new Stack(1005L, "Spring ORM & Data JPA"));
            stackRepository.save(new Stack(1006L, "Core Java"));
        }

        // 3. Seed Topics (Image 14)
        if (topicRepository.count() == 0) {
            Stack springCloud = stackRepository.findById(1001L).orElse(null);
            if (springCloud != null) {
                topicRepository.save(new Topic(1001L, "Introduction to Spring Cloud", springCloud));
                topicRepository.save(new Topic(1002L, "Service Discovery design pattern – Eureka Server & Discovery Client", springCloud));
                topicRepository.save(new Topic(1003L, "Eureka Heartbeats & Self Preservation", springCloud));
                topicRepository.save(new Topic(1004L, "Spring Cloud LoadBalancer", springCloud));
                topicRepository.save(new Topic(1005L, "Spring Cloud OpenFeign", springCloud));
                topicRepository.save(new Topic(1006L, "Resilience4J- Circuit Breaker", springCloud));
                topicRepository.save(new Topic(1007L, "Spring Boot Actuator", springCloud));
            }
        }

        // 4. Seed SME Mappings (Image 15)
        if (smeStackMappingRepository.count() == 0) {
            Stack springCloud = stackRepository.findById(1001L).orElse(null);
            Stack springBoot = stackRepository.findById(1002L).orElse(null);
            Stack springCore = stackRepository.findById(1003L).orElse(null);
            Stack springMvc = stackRepository.findById(1004L).orElse(null);

            if (springCloud != null) {
                smeStackMappingRepository.save(new SmeStackMapping("gaurav.a.bhola", springCloud));
                smeStackMappingRepository.save(new SmeStackMapping("divya.madhanasekar", springCloud));
                smeStackMappingRepository.save(new SmeStackMapping("indugu.hari.prasad", springCloud));
            }
            if (springBoot != null) {
                smeStackMappingRepository.save(new SmeStackMapping("birendra.kumar.singh", springBoot));
                smeStackMappingRepository.save(new SmeStackMapping("swati.avinash.nikam", springBoot));
            }
            if (springCore != null) {
                smeStackMappingRepository.save(new SmeStackMapping("gaurav.a.bhola", springCore));
            }
            if (springMvc != null) {
                smeStackMappingRepository.save(new SmeStackMapping("divya.madhanasekar", springMvc));
            }
        }

        // 5. Seed Questions
        if (questionRepository.count() == 0) {
            Stack springBoot = stackRepository.findByName("Spring Boot").orElse(null);
            Stack springCloud = stackRepository.findByName("Spring Cloud").orElse(null);

            Topic defaultBootTopic = topicRepository.findByName("Spring Boot Actuator").orElse(null);
            Topic defaultCloudTopic = topicRepository.findByName("Introduction to Spring Cloud").orElse(null);

            questionRepository.save(Question.builder()
                    .stem("Alex is building a microservices-based system using Spring Boot...")
                    .stackEntity(springBoot)
                    .topicEntity(defaultBootTopic)
                    .difficulty("Medium")
                    .status("Ready for Review")
                    .options(List.of("Option A", "Option B", "Option C", "Option D"))
                    .correctOption(0)
                    .creatorId("bhola.gaurav")
                    .build());
            
            questionRepository.save(Question.builder()
                    .stem("John has multiple instances of a service running dynamically...")
                    .stackEntity(springCloud)
                    .topicEntity(defaultCloudTopic)
                    .difficulty("Medium")
                    .status("Approved")
                    .options(List.of("Option A", "Option B", "Option C", "Option D"))
                    .correctOption(1)
                    .creatorId("swati.nikam")
                    .reviewerId("bhola.gaurav")
                    .build());
            
            questionRepository.save(Question.builder()
                    .stem("What is the purpose of Spring Boot Starters?")
                    .stackEntity(springBoot)
                    .topicEntity(defaultBootTopic)
                    .difficulty("Easy")
                    .status("Under Review")
                    .options(List.of("To bootstrap Spring applications", "To connect to databases", "To manage security", "To create REST controllers"))
                    .correctOption(0)
                    .creatorId("bhola.gaurav")
                    .reviewerId("admin.user")
                    .build());
            
            questionRepository.save(Question.builder()
                    .stem("Does the @SpringBootApplication annotation combine internally?")
                    .stackEntity(springBoot)
                    .topicEntity(defaultBootTopic)
                    .difficulty("Medium")
                    .status("Rejected")
                    .options(List.of("Yes, @Configuration, @EnableAutoConfiguration, @ComponentScan", "No, it's a standalone annotation", "Yes, @Controller, @Service, @Repository", "Only @Configuration and @ComponentScan"))
                    .correctOption(0)
                    .creatorId("divya.madhnasekar")
                    .reviewerId("bhola.gaurav")
                    .build());
            
            questionRepository.save(Question.builder()
                    .stem("Which component is used for client-side load balancing in Spring Cloud?")
                    .stackEntity(springCloud)
                    .topicEntity(defaultCloudTopic)
                    .difficulty("Medium")
                    .status("Draft")
                    .options(List.of("Spring Cloud Gateway", "Spring Cloud LoadBalancer", "Eureka Server", "Config Server"))
                    .correctOption(1)
                    .creatorId("indugu.hariprasad")
                    .build());
        }
    }
}
