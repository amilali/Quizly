package com.quizly.backend.service;

import com.quizly.backend.model.EventQuestion;
import com.quizly.backend.model.Question;
import com.quizly.backend.model.QuizEvent;
import com.quizly.backend.repository.EventQuestionRepository;
import com.quizly.backend.repository.QuestionRepository;
import com.quizly.backend.repository.QuizEventRepository;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class QuizEventService {

    private final QuizEventRepository quizEventRepository;
    private final EventQuestionRepository eventQuestionRepository;
    private final QuestionRepository questionRepository;
    private final GameService gameService;

    public QuizEventService(QuizEventRepository quizEventRepository, EventQuestionRepository eventQuestionRepository, QuestionRepository questionRepository, GameService gameService) {
        this.quizEventRepository = quizEventRepository;
        this.eventQuestionRepository = eventQuestionRepository;
        this.questionRepository = questionRepository;
        this.gameService = gameService;
    }

    public List<QuizEvent> getEventsByHost(String hostId) {
        return quizEventRepository.findByHostIdOrderByCreatedAtDesc(hostId);
    }

    public QuizEvent getEvent(Long id) {
        return quizEventRepository.findById(id).orElseThrow(() -> new RuntimeException("Event not found"));
    }

    public QuizEvent createEvent(String name, long timeLimitSeconds, String hostId) {
        QuizEvent event = new QuizEvent();
        event.setName(name);
        event.setTimeLimitSeconds(timeLimitSeconds);
        event.setHostId(hostId);
        return quizEventRepository.save(event);
    }

    public QuizEvent updateEvent(Long id, String name, long timeLimitSeconds) {
        QuizEvent event = getEvent(id);
        event.setName(name);
        event.setTimeLimitSeconds(timeLimitSeconds);
        return quizEventRepository.save(event);
    }

    public void deleteEvent(Long id) {
        quizEventRepository.deleteById(id);
    }

    public QuizEvent autoPullQuestions(Long eventId, String stack, String topic, int count) {
        QuizEvent event = getEvent(eventId);
        List<Question> allApproved = questionRepository.findAll().stream()
                .filter(q -> "Approved".equalsIgnoreCase(q.getStatus()))
                .filter(q -> (stack == null || stack.isEmpty() || stack.equalsIgnoreCase(q.getStack())))
                .filter(q -> (topic == null || topic.isEmpty() || topic.equalsIgnoreCase(q.getTopic())))
                .collect(Collectors.toList());

        Collections.shuffle(allApproved);
        int actualCount = Math.min(count, allApproved.size());
        
        for (int i = 0; i < actualCount; i++) {
            Question q = allApproved.get(i);
            EventQuestion eq = new EventQuestion();
            eq.setStem(q.getStem());
            eq.setOptionA(q.getOptionA());
            eq.setOptionB(q.getOptionB());
            eq.setOptionC(q.getOptionC());
            eq.setOptionD(q.getOptionD());
            eq.setCorrectAnswer(q.getCorrectAnswer());
            eq.setTimeLimitSeconds(event.getTimeLimitSeconds());
            eq.setQuizEvent(event);
            event.getQuestions().add(eq);
        }
        
        return quizEventRepository.save(event);
    }

    public EventQuestion addQuestion(Long eventId, EventQuestion question) {
        QuizEvent event = getEvent(eventId);
        question.setQuizEvent(event);
        event.getQuestions().add(question);
        quizEventRepository.save(event);
        return question;
    }

    public EventQuestion updateQuestion(Long eventId, Long questionId, EventQuestion updates) {
        QuizEvent event = getEvent(eventId);
        EventQuestion question = event.getQuestions().stream()
                .filter(q -> q.getId().equals(questionId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Question not found in event"));
                
        question.setStem(updates.getStem());
        question.setOptionA(updates.getOptionA());
        question.setOptionB(updates.getOptionB());
        question.setOptionC(updates.getOptionC());
        question.setOptionD(updates.getOptionD());
        question.setCorrectAnswer(updates.getCorrectAnswer());
        question.setTimeLimitSeconds(updates.getTimeLimitSeconds());
        
        return eventQuestionRepository.save(question);
    }

    public void deleteQuestion(Long eventId, Long questionId) {
        QuizEvent event = getEvent(eventId);
        event.getQuestions().removeIf(q -> q.getId().equals(questionId));
        quizEventRepository.save(event);
    }

    public QuizEvent publishEvent(Long eventId) {
        QuizEvent event = getEvent(eventId);
        if (event.getQuestions().isEmpty()) {
            throw new RuntimeException("Cannot publish an event with no questions.");
        }
        
        String pin = generateAlphanumericPin();
        event.setPin(pin);
        event.setStatus("Published");
        return quizEventRepository.save(event);
    }

    public QuizEvent startSession(Long eventId) {
        QuizEvent event = getEvent(eventId);
        if (event.getPin() != null) {
            gameService.initSessionFromEvent(event);
        }
        return event;
    }

    public QuizEvent stopSession(Long eventId) {
        QuizEvent event = getEvent(eventId);
        if (event.getPin() != null) {
            gameService.endSession(event.getPin());
        }
        return event;
    }
    
    public QuizEvent unpublishEvent(Long eventId) {
        QuizEvent event = getEvent(eventId);
        if (event.getPin() != null) {
            gameService.endSession(event.getPin());
        }
        event.setStatus("Draft");
        event.setPin(null);
        return quizEventRepository.save(event);
    }

    private String generateAlphanumericPin() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        Random rnd = new Random();
        StringBuilder sb = new StringBuilder(6);
        for(int i = 0; i < 6; i++) {
            sb.append(chars.charAt(rnd.nextInt(chars.length())));
        }
        return sb.toString();
    }
}
