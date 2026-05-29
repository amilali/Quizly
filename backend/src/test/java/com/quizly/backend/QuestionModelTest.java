package com.quizly.backend;

import com.quizly.backend.model.Question;
import com.quizly.backend.model.Stack;
import com.quizly.backend.model.Topic;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class QuestionModelTest {

    @Test
    void testOptionsAndCorrectOptionMapping() {
        Question question = new Question();
        question.setOptions(List.of("Option A text", "Option B text", "Option C text", "Option D text"));
        question.setCorrectOption(1); // Index 1 represents option B

        // Verify direct JPA database column mappings
        assertEquals("Option A text", question.getOptionA());
        assertEquals("Option B text", question.getOptionB());
        assertEquals("Option C text", question.getOptionC());
        assertEquals("Option D text", question.getOptionD());
        assertEquals("B", question.getCorrectAnswer());

        // Verify transient getter backward-compatibility translation
        assertEquals(List.of("Option A text", "Option B text", "Option C text", "Option D text"), question.getOptions());
        assertEquals(1, question.getCorrectOption());
    }

    @Test
    void testStackAndTopicTransientGetterSetterMapping() {
        Question question = new Question();
        
        // Simulating incoming client request payloads (setting transient String fields)
        question.setStack("Spring Boot");
        question.setTopic("Spring Boot Actuator");

        assertEquals("Spring Boot", question.getStack());
        assertEquals("Spring Boot Actuator", question.getTopic());

        // Simulating ORM database mapping
        Stack stack = new Stack(1002L, "Spring Boot");
        Topic topic = new Topic(1007L, "Spring Boot Actuator", stack);
        
        question.setStackEntity(stack);
        question.setTopicEntity(topic);

        assertEquals("Spring Boot", question.getStack());
        assertEquals("Spring Boot Actuator", question.getTopic());
    }
}
