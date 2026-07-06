package com.quizly.backend.controller;

import com.quizly.backend.repository.GameAnswerRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final GameAnswerRepository gameAnswerRepository;

    public AnalyticsController(GameAnswerRepository gameAnswerRepository) {
        this.gameAnswerRepository = gameAnswerRepository;
    }

    private Instant getSince(Integer days) {
        if (days == null || days <= 0) {
            return Instant.EPOCH; // All time
        }
        return Instant.now().minus(days, ChronoUnit.DAYS);
    }

    /** Overview stats: total games, players, answers, accuracy */
    @GetMapping("/overview")
    public ResponseEntity<?> getOverview(@RequestParam(required = false) Integer days) {
        Instant since = getSince(days);
        long totalAnswers = gameAnswerRepository.countAnswersSince(since);
        long totalGames = gameAnswerRepository.countDistinctGames(since);
        long totalPlayers = gameAnswerRepository.countDistinctPlayers(since);
        long correctAnswers = gameAnswerRepository.countCorrectAnswersSince(since);

        double accuracy = totalAnswers > 0 ? (double) correctAnswers / totalAnswers * 100 : 0;

        return ResponseEntity.ok(Map.of(
                "totalGames", totalGames,
                "totalPlayers", totalPlayers,
                "totalAnswers", totalAnswers,
                "correctAnswers", correctAnswers,
                "accuracyPercent", Math.round(accuracy * 10.0) / 10.0
        ));
    }

    /** Per-player performance: name, correct, incorrect, accuracy, total points */
    @GetMapping("/players")
    public ResponseEntity<?> getPlayerStats(@RequestParam(required = false) Integer days) {
        Instant since = getSince(days);
        List<Object[]> raw = gameAnswerRepository.getPlayerSummary(since);
        List<Map<String, Object>> result = new ArrayList<>();

        for (Object[] row : raw) {
            String playerName = (String) row[0];
            long total = ((Number) row[1]).longValue();
            long correct = ((Number) row[2]).longValue();
            long incorrect = total - correct;
            long points = ((Number) row[3]).longValue();
            double accuracy = total > 0 ? (double) correct / total * 100 : 0;

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("playerName", playerName);
            entry.put("totalAnswers", total);
            entry.put("correct", correct);
            entry.put("incorrect", incorrect);
            entry.put("totalPoints", points);
            entry.put("accuracyPercent", Math.round(accuracy * 10.0) / 10.0);
            result.add(entry);
        }
        return ResponseEntity.ok(result);
    }

    /** Per-question difficulty: stem, stack, topic, correct%, total attempts */
    @GetMapping("/questions")
    public ResponseEntity<?> getQuestionStats(@RequestParam(required = false) Integer days) {
        Instant since = getSince(days);
        List<Object[]> raw = gameAnswerRepository.getQuestionDifficulty(since);
        List<Map<String, Object>> result = new ArrayList<>();

        for (Object[] row : raw) {
            Long questionId = ((Number) row[0]).longValue();
            String stem = (String) row[1];
            String stack = (String) row[2];
            String topic = (String) row[3];
            long total = ((Number) row[4]).longValue();
            long correct = ((Number) row[5]).longValue();
            double correctPct = total > 0 ? (double) correct / total * 100 : 0;

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("questionId", questionId);
            entry.put("stem", stem != null ? (stem.length() > 80 ? stem.substring(0, 80) + "…" : stem) : "");
            entry.put("stack", stack);
            entry.put("topic", topic);
            entry.put("totalAttempts", total);
            entry.put("correctCount", correct);
            entry.put("incorrectCount", total - correct);
            entry.put("correctPercent", Math.round(correctPct * 10.0) / 10.0);
            result.add(entry);
        }
        return ResponseEntity.ok(result);
    }

    /** Activity timeline: answers bucketed by hour over the last N days */
    @GetMapping("/timeline")
    public ResponseEntity<?> getTimeline(@RequestParam(defaultValue = "7") int days) {
        Instant since = Instant.now().minus(days, ChronoUnit.DAYS);
        List<Object[]> raw = gameAnswerRepository.getTimeline(since);

        // Bucket by hour
        Map<String, long[]> buckets = new TreeMap<>();
        for (Object[] row : raw) {
            Instant ts = (Instant) row[0];
            boolean correct = (Boolean) row[1];
            // truncate to hour
            String hour = ts.truncatedTo(ChronoUnit.HOURS).toString();
            buckets.computeIfAbsent(hour, k -> new long[]{0, 0});
            if (correct) buckets.get(hour)[0]++;
            else buckets.get(hour)[1]++;
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<String, long[]> e : buckets.entrySet()) {
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("time", e.getKey());
            point.put("correct", e.getValue()[0]);
            point.put("incorrect", e.getValue()[1]);
            point.put("total", e.getValue()[0] + e.getValue()[1]);
            result.add(point);
        }
        return ResponseEntity.ok(result);
    }
}
