package com.quizly.backend.repository;

import com.quizly.backend.model.GameAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface GameAnswerRepository extends JpaRepository<GameAnswer, Long> {

    // All answers for a specific game pin
    List<GameAnswer> findByPin(String pin);

    // All answers by a specific player across all games
    List<GameAnswer> findByPlayerName(String playerName);

    // Summary per player: name, total, correct count
    @Query("""
        SELECT g.playerName as playerName,
               COUNT(g) as totalAnswers,
               SUM(CASE WHEN g.correct = true THEN 1 ELSE 0 END) as correctAnswers,
               SUM(g.pointsAwarded) as totalPoints
        FROM GameAnswer g
        GROUP BY g.playerName
        ORDER BY SUM(g.pointsAwarded) DESC
    """)
    List<Object[]> getPlayerSummary();

    // Summary per question: question stem, stack, topic, correct count, total count
    @Query("""
        SELECT g.questionId as questionId,
               g.questionStem as questionStem,
               g.questionStack as questionStack,
               g.questionTopic as questionTopic,
               COUNT(g) as totalAttempts,
               SUM(CASE WHEN g.correct = true THEN 1 ELSE 0 END) as correctCount
        FROM GameAnswer g
        GROUP BY g.questionId, g.questionStem, g.questionStack, g.questionTopic
        ORDER BY COUNT(g) DESC
    """)
    List<Object[]> getQuestionDifficulty();

    // Timeline: answers grouped by hour in the last N days
    @Query("""
        SELECT g.answeredAt, g.correct
        FROM GameAnswer g
        WHERE g.answeredAt >= :since
        ORDER BY g.answeredAt ASC
    """)
    List<Object[]> getTimeline(@Param("since") Instant since);

    // Overview counts
    @Query("SELECT COUNT(DISTINCT g.pin) FROM GameAnswer g")
    long countDistinctGames();

    @Query("SELECT COUNT(DISTINCT g.playerName) FROM GameAnswer g")
    long countDistinctPlayers();
}
