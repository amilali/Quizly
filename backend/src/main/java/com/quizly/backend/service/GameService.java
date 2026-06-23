package com.quizly.backend.service;

import com.quizly.backend.model.GameSession;
import com.quizly.backend.model.Question;
import com.quizly.backend.repository.QuestionRepository;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.*;
import java.util.concurrent.*;
import java.util.stream.Collectors;

@Service
public class GameService {

    private final QuestionRepository questionRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // PIN -> GameSession
    private final Map<String, GameSession> activeSessions = new ConcurrentHashMap<>();
    // PIN -> scheduled auto-reveal future (cancelled when host manually reveals)
    private final Map<String, ScheduledFuture<?>> scheduledReveal = new ConcurrentHashMap<>();

    // WebSocket sessionId -> {pin, playerName}
    private final Map<String, String[]> socketSessions = new ConcurrentHashMap<>();

    // Shared scheduler thread pool
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(4);

    // Delay after reveal before auto-advancing to next question (ms)
    private static final long AUTO_NEXT_DELAY_MS = 5_000;
    // Max points per question
    private static final int MAX_POINTS = 1000;

    private final com.quizly.backend.repository.EventQuestionRepository eventQuestionRepository;
    private final io.micrometer.core.instrument.MeterRegistry meterRegistry;

    public GameService(QuestionRepository questionRepository, com.quizly.backend.repository.EventQuestionRepository eventQuestionRepository, SimpMessagingTemplate messagingTemplate, io.micrometer.core.instrument.MeterRegistry meterRegistry) {
        this.questionRepository = questionRepository;
        this.eventQuestionRepository = eventQuestionRepository;
        this.messagingTemplate = messagingTemplate;
        this.meterRegistry = meterRegistry;
    }

    public Map<String, Object> createGame(String hostId, String stack, String topic, int questionCount, long timeLimitMs) {
        // Fetch approved questions, filter by stack/topic if provided
        List<Question> allApproved = questionRepository.findAll().stream()
                .filter(q -> "Approved".equalsIgnoreCase(q.getStatus()))
                .filter(q -> (stack == null || stack.isEmpty() || stack.equalsIgnoreCase(q.getStack())))
                .filter(q -> (topic == null || topic.isEmpty() || topic.equalsIgnoreCase(q.getTopic())))
                .collect(Collectors.toList());

        if (allApproved.isEmpty()) {
            throw new RuntimeException("No approved questions found for the selected criteria.");
        }

        Collections.shuffle(allApproved);
        int count = Math.min(questionCount, allApproved.size());
        List<Long> questionIds = allApproved.subList(0, count).stream()
                .map(Question::getId)
                .collect(Collectors.toList());

        String pin = generatePin();
        GameSession session = new GameSession(pin, hostId, questionIds, timeLimitMs);
        // Host is NOT added as a player — they manage the game, not participate

        activeSessions.put(pin, session);

        Map<String, Object> response = new HashMap<>();
        response.put("pin", pin);
        response.put("totalQuestions", questionIds.size());
        response.put("hostId", hostId);
        return response;
    }

    public void initSessionFromEvent(com.quizly.backend.model.QuizEvent event) {
        List<Long> questionIds = event.getQuestions().stream()
                .map(com.quizly.backend.model.EventQuestion::getId)
                .collect(Collectors.toList());

        GameSession session = new GameSession(event.getPin(), event.getHostId(), questionIds, event.getTimeLimitSeconds() * 1000L);
        session.setEventBased(true);
        activeSessions.put(event.getPin(), session);
    }

    public void endSession(String pin) {
        activeSessions.remove(pin);
        ScheduledFuture<?> old = scheduledReveal.remove(pin);
        if (old != null) old.cancel(false);
    }

    public Map<String, Object> joinGame(String pin, String playerName) {
        GameSession session = getSession(pin);
        if (session.getStatus() != GameSession.Status.WAITING) {
            throw new RuntimeException("Game already started or ended.");
        }
        session.addPlayer(playerName);

        // Notify all players about new participant
        broadcastPlayerList(session);

        Map<String, Object> response = new HashMap<>();
        response.put("pin", pin);
        response.put("playerName", playerName);
        response.put("status", "JOINED");
        response.put("totalQuestions", session.getTotalQuestions());
        response.put("playerCount", session.getPlayerScores().size());
        return response;
    }

    public void startGame(String pin) {
        GameSession session = getSession(pin);
        session.setStatus(GameSession.Status.ACTIVE);
        broadcastStatusUpdate(session, "STARTED");
        
        // Record business analytics metrics
        meterRegistry.counter("quizly.game.started").increment();
        
        // Wait 3 seconds to allow frontend to show a 3-2-1 animated countdown
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try { Thread.sleep(3000); } catch (InterruptedException e) {}
            broadcastQuestion(session);
        });
    }

    public void submitAnswer(String pin, String playerName, Long questionId, int selectedOption) {
        GameSession session = getSession(pin);
        if (session.getStatus() != GameSession.Status.ACTIVE) return;

        // Prevent double-answering
        Boolean alreadyAnswered = session.getAnsweredThisRound().getOrDefault(playerName, false);
        if (Boolean.TRUE.equals(alreadyAnswered)) return;

        // Validate answer server-side
        int correctIndex;
        if (session.isEventBased()) {
            Optional<com.quizly.backend.model.EventQuestion> eqOpt = eventQuestionRepository.findById(questionId);
            if (eqOpt.isEmpty()) return;
            correctIndex = getCorrectOptionIndex(eqOpt.get().getCorrectAnswer());
        } else {
            Optional<Question> questionOpt = questionRepository.findById(questionId);
            if (questionOpt.isEmpty()) return;
            correctIndex = getCorrectOptionIndex(questionOpt.get().getCorrectAnswer());
        }
        boolean isCorrect = (selectedOption == correctIndex);

        // Record business analytics metrics for answers
        meterRegistry.counter("quizly.answers", 
            "status", isCorrect ? "correct" : "incorrect",
            "player", playerName != null ? playerName : "unknown"
        ).increment();

        int pointsAwarded = 0;
        if (isCorrect) {
            long elapsed = System.currentTimeMillis() - session.getQuestionStartTime();
            double timeRatio = Math.max(0, 1.0 - (double) elapsed / session.getTimeLimitMs());
            pointsAwarded = (int) (MAX_POINTS * (0.5 + 0.5 * timeRatio)); // 500-1000 pts
        }

        session.getAnsweredThisRound().put(playerName, true);
        if (isCorrect) {
            session.getPlayerScores().merge(playerName, pointsAwarded, Integer::sum);
        }

        // Send personal result back to the answering player
        Map<String, Object> result = new HashMap<>();
        result.put("type", "ANSWER_RESULT");
        result.put("isCorrect", isCorrect);
        result.put("pointsAwarded", pointsAwarded);
        result.put("correctOption", correctIndex);
        result.put("totalScore", session.getPlayerScores().getOrDefault(playerName, 0));
        messagingTemplate.convertAndSend("/topic/game/" + pin + "/player/" + playerName, result);

        // Broadcast updated leaderboard to everyone
        broadcastLeaderboard(session);
    }

    public void registerSocketSession(String sessionId, String pin, String playerName) {
        socketSessions.put(sessionId, new String[]{pin, playerName});
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        String sessionId = event.getSessionId();
        String[] info = socketSessions.remove(sessionId);
        if (info != null) {
            String pin = info[0];
            String playerName = info[1];
            try {
                GameSession session = getSession(pin);
                // Only remove if the game is still waiting
                if (session.getStatus() == GameSession.Status.WAITING) {
                    session.getPlayerScores().remove(playerName);
                    broadcastPlayerList(session);
                }
            } catch (Exception ignored) {
                // Session might already be gone
            }
        }
    }

    public void nextQuestion(String pin) {
        GameSession session = getSession(pin);
        session.incrementQuestionIndex();
        session.resetAnsweredThisRound();

        if (session.hasCurrentQuestion()) {
            session.setStatus(GameSession.Status.ACTIVE);
            broadcastQuestion(session);
        } else {
            session.setStatus(GameSession.Status.ENDED);
            broadcastStatusUpdate(session, "ENDED");
            broadcastLeaderboard(session);
        }
    }

    public void showAnswer(String pin) {
        GameSession session = getSession(pin);
        // Cancel the auto-reveal timer if host manually triggered it
        ScheduledFuture<?> existing = scheduledReveal.remove(pin);
        if (existing != null) existing.cancel(false);

        doShowAnswer(session);
    }

    /** Internal reveal — safe to call from scheduler thread */
    private void doShowAnswer(GameSession session) {
        if (session.getStatus() == GameSession.Status.SHOWING_ANSWER
                || session.getStatus() == GameSession.Status.ENDED) return;

        session.setStatus(GameSession.Status.SHOWING_ANSWER);
        String pin = session.getPin();

        Long questionId = session.getCurrentQuestionId();
        if (questionId == null) return;

        if (session.isEventBased()) {
            eventQuestionRepository.findById(questionId).ifPresent(q -> {
                Map<String, Object> payload = new HashMap<>();
                payload.put("type", "SHOW_ANSWER");
                payload.put("correctOption", getCorrectOptionIndex(q.getCorrectAnswer()));
                messagingTemplate.convertAndSend("/topic/game/" + pin + "/events", payload);
            });
        } else {
            questionRepository.findById(questionId).ifPresent(q -> {
                Map<String, Object> payload = new HashMap<>();
                payload.put("type", "SHOW_ANSWER");
                payload.put("correctOption", getCorrectOptionIndex(q.getCorrectAnswer()));
                messagingTemplate.convertAndSend("/topic/game/" + pin + "/events", payload);
            });
        }
        broadcastLeaderboard(session);

        // Auto-advance to next question after AUTO_NEXT_DELAY_MS
        scheduler.schedule(() -> {
            try {
                nextQuestion(pin);
            } catch (Exception ignored) {}
        }, AUTO_NEXT_DELAY_MS, TimeUnit.MILLISECONDS);
    }

    public Map<String, Object> getGameStatus(String pin) {
        GameSession session = getSession(pin);
        Map<String, Object> status = new HashMap<>();
        status.put("pin", pin);
        status.put("status", session.getStatus().name());
        status.put("questionIndex", session.getQuestionIndex());
        status.put("totalQuestions", session.getTotalQuestions());
        status.put("playerCount", session.getPlayerScores().size());
        return status;
    }

    public List<Map<String, Object>> getLeaderboard(String pin) {
        GameSession session = getSession(pin);
        return buildLeaderboard(session);
    }

    // ---- Private Helpers ----

    private void broadcastQuestion(GameSession session) {
        Long questionId = session.getCurrentQuestionId();
        if (questionId == null) return;

        Runnable sendQuestion = () -> {
            try {
                session.setQuestionStartTime(System.currentTimeMillis());
                
                Map<String, Object> payload = new HashMap<>();
            if (session.isEventBased()) {
                com.quizly.backend.model.EventQuestion q = eventQuestionRepository.findById(questionId).orElse(null);
                if (q == null) return;
                payload.put("type", "QUESTION");
                payload.put("questionId", q.getId());
                payload.put("stem", q.getStem());
                payload.put("options", List.of(
                        q.getOptionA() != null ? q.getOptionA() : "",
                        q.getOptionB() != null ? q.getOptionB() : "",
                        q.getOptionC() != null ? q.getOptionC() : "",
                        q.getOptionD() != null ? q.getOptionD() : ""
                ));
                payload.put("timeLimitMs", q.getTimeLimitSeconds() * 1000L);
                payload.put("stack", q.getQuizEvent().getName());
            } else {
                Question q = questionRepository.findById(questionId).orElse(null);
                if (q == null) return;
                payload.put("type", "QUESTION");
                payload.put("questionId", q.getId());
                payload.put("stem", q.getStem());
                payload.put("options", List.of(
                        q.getOptionA() != null ? q.getOptionA() : "",
                        q.getOptionB() != null ? q.getOptionB() : "",
                        q.getOptionC() != null ? q.getOptionC() : "",
                        q.getOptionD() != null ? q.getOptionD() : ""
                ));
                payload.put("timeLimitMs", session.getTimeLimitMs());
                payload.put("stack", q.getStack());
                payload.put("topic", q.getTopic());
                payload.put("difficulty", q.getDifficulty());
            }

            payload.put("questionIndex", session.getQuestionIndex());
            payload.put("totalQuestions", session.getTotalQuestions());
            
            messagingTemplate.convertAndSend("/topic/game/" + session.getPin() + "/events", payload);

            ScheduledFuture<?> old = scheduledReveal.remove(session.getPin());
            if (old != null) old.cancel(false);

            String pin = session.getPin();
            long delay = payload.containsKey("timeLimitMs") ? ((Number)payload.get("timeLimitMs")).longValue() : session.getTimeLimitMs();
            ScheduledFuture<?> future = scheduler.schedule(
                    () -> { try { doShowAnswer(getSession(pin)); } catch (Exception ignored) {} },
                    delay, TimeUnit.MILLISECONDS
            );
            scheduledReveal.put(pin, future);
            } catch (Exception e) {
                System.err.println("Exception in broadcastQuestion: " + e.getMessage());
                e.printStackTrace();
            }
        };
        sendQuestion.run();
    }

    private void broadcastLeaderboard(GameSession session) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "LEADERBOARD");
        payload.put("leaderboard", buildLeaderboard(session));
        messagingTemplate.convertAndSend("/topic/game/" + session.getPin() + "/events", payload);
    }

    private void broadcastStatusUpdate(GameSession session, String event) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", event);
        payload.put("status", session.getStatus().name());
        payload.put("totalQuestions", session.getTotalQuestions());
        messagingTemplate.convertAndSend("/topic/game/" + session.getPin() + "/events", payload);
    }

    private void broadcastPlayerList(GameSession session) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "PLAYER_JOINED");
        payload.put("players", new ArrayList<>(session.getPlayerScores().keySet()));
        payload.put("playerCount", session.getPlayerScores().size());
        messagingTemplate.convertAndSend("/topic/game/" + session.getPin() + "/events", payload);
    }

    private List<Map<String, Object>> buildLeaderboard(GameSession session) {
        return session.getPlayerScores().entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .map(entry -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("playerName", entry.getKey());
                    item.put("score", entry.getValue());
                    return item;
                })
                .collect(Collectors.toList());
    }

    private int getCorrectOptionIndex(String correctAnswer) {
        if (correctAnswer == null) return 0;
        return switch (correctAnswer.toUpperCase()) {
            case "B" -> 1;
            case "C" -> 2;
            case "D" -> 3;
            default -> 0; // "A"
        };
    }

    private String generatePin() {
        Random random = new Random();
        String pin;
        do {
            pin = String.format("%06d", random.nextInt(1_000_000));
        } while (activeSessions.containsKey(pin));
        return pin;
    }

    private GameSession getSession(String pin) {
        GameSession session = activeSessions.get(pin);
        if (session == null) throw new RuntimeException("Game session not found: " + pin);
        return session;
    }
}
