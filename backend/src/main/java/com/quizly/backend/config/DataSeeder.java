package com.quizly.backend.config;

import com.quizly.backend.model.Role;
import com.quizly.backend.model.User;
import com.quizly.backend.model.Question;
import com.quizly.backend.repository.UserRepository;
import com.quizly.backend.repository.QuestionRepository;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final QuestionRepository questionRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository, QuestionRepository questionRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.questionRepository = questionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
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

        if (questionRepository.count() == 0) {
            questionRepository.save(Question.builder()
                    .stem("Alex is building a microservices-based system using Spring Boot...")
                    .stack("Spring Boot")
                    .topic("Spring Boot Introduction")
                    .difficulty("Medium")
                    .status("Ready for Review")
                    .options(List.of("Option A", "Option B", "Option C", "Option D"))
                    .correctOption(0)
                    .creatorId("bhola.gaurav")
                    .build());
            
            questionRepository.save(Question.builder()
                    .stem("John has multiple instances of a service running dynamically...")
                    .stack("Spring Cloud")
                    .topic("Spring Cloud OpenFeign")
                    .difficulty("Medium")
                    .status("Approved")
                    .options(List.of("Option A", "Option B", "Option C", "Option D"))
                    .correctOption(1)
                    .creatorId("swati.nikam")
                    .reviewerId("bhola.gaurav")
                    .build());
            
            questionRepository.save(Question.builder()
                    .stem("What is the purpose of Spring Boot Starters?")
                    .stack("Spring Boot")
                    .topic("Spring Boot Starters")
                    .difficulty("Easy")
                    .status("Under Review")
                    .options(List.of("To bootstrap Spring applications", "To connect to databases", "To manage security", "To create REST controllers"))
                    .correctOption(0)
                    .creatorId("bhola.gaurav")
                    .reviewerId("admin.user")
                    .build());
            
            questionRepository.save(Question.builder()
                    .stem("Does the @SpringBootApplication annotation combine internally?")
                    .stack("Spring Boot")
                    .topic("SpringBootApplication annotation")
                    .difficulty("Medium")
                    .status("Rejected")
                    .options(List.of("Yes, @Configuration, @EnableAutoConfiguration, @ComponentScan", "No, it's a standalone annotation", "Yes, @Controller, @Service, @Repository", "Only @Configuration and @ComponentScan"))
                    .correctOption(0)
                    .creatorId("divya.madhnasekar")
                    .reviewerId("bhola.gaurav")
                    .build());
            
            questionRepository.save(Question.builder()
                    .stem("Which component is used for client-side load balancing in Spring Cloud?")
                    .stack("Spring Cloud")
                    .topic("Spring Cloud LoadBalancer")
                    .difficulty("Medium")
                    .status("Draft")
                    .options(List.of("Spring Cloud Gateway", "Spring Cloud LoadBalancer", "Eureka Server", "Config Server"))
                    .correctOption(1)
                    .creatorId("indugu.hariprasad")
                    .build());
        }
    }
}
