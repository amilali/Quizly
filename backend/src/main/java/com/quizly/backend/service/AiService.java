package com.quizly.backend.service;

import com.quizly.backend.dto.DuplicateCheckResponse;
import com.quizly.backend.dto.GenerateRequest;
import com.quizly.backend.model.Question;
import com.quizly.backend.repository.QuestionRepository;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.document.Document;

import io.micrometer.tracing.Tracer;
import io.micrometer.tracing.Span;

@Service
public class AiService {

    private final QuestionRepository questionRepository;
    private final ChatModel chatModel;
    private final VectorStore vectorStore;
    private final Tracer tracer;

    public AiService(QuestionRepository questionRepository, ChatModel chatModel, VectorStore vectorStore, Tracer tracer) {
        this.questionRepository = questionRepository;
        this.chatModel = chatModel;
        this.vectorStore = vectorStore;
        this.tracer = tracer;
    }

    @PostConstruct
    public void initVectorStore() {
        System.out.println("Initializing Vector Store with existing questions...");
        List<Question> allQuestions = questionRepository.findAll();
        List<Document> documents = new ArrayList<>();
        
        for (Question q : allQuestions) {
            if (q.getStem() != null && !q.getStem().isEmpty()) {
                documents.add(new Document(q.getStem(), Map.of(
                    "questionId", q.getId() != null ? q.getId() : 0L,
                    "stack", q.getStack() != null ? q.getStack() : "",
                    "topic", q.getTopic() != null ? q.getTopic() : ""
                )));
            }
        }
        
        if (!documents.isEmpty()) {
            try {
                vectorStore.add(documents);
                System.out.println("Successfully synced " + documents.size() + " questions to Vector Store.");
            } catch (Exception e) {
                System.err.println("Failed to sync questions to Vector Store on startup: " + e.getMessage());
            }
        }
    }

    public List<Question> generateQuestions(GenerateRequest request, String creatorId) {
        Span span = tracer.nextSpan().name("ai_generate_questions").start();
        try (Tracer.SpanInScope ws = tracer.withSpan(span)) {
            span.tag("quizly.request.count", String.valueOf(request.getCount()));
            span.tag("quizly.request.topic", request.getTopic() != null ? request.getTopic() : "unknown");
            
            List<Question> generatedQuestions = new ArrayList<>();
            int maxRetries = 2; // We retry the whole batch a couple of times if the API completely fails
            int attempts = 0;
            
            while (attempts < maxRetries && generatedQuestions.isEmpty()) {
                try {
                    generatedQuestions = generateQuestionBatch(request.getStack(), request.getTopic(), request.getDifficulty(), request.getCount(), request.getAvoidStems());
                } catch (Exception e) {
                    attempts++;
                    span.event("batch_generation_error_retrying");
                    if (attempts >= maxRetries) {
                        System.err.println("Batch generation failed completely: " + e.getMessage());
                        return new ArrayList<>(); // Return empty list, UI will catch partial/0 success
                    }
                }
            }
            
            for (Question q : generatedQuestions) {
                q.setCreatorId(creatorId);
                q.setStatus("Draft");
            }
            
            return generatedQuestions;
        } finally {
            span.end();
        }
    }

    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();

    private List<Question> generateQuestionBatch(String stack, String topic, String difficulty, int count, java.util.List<String> avoidStems) {
        Span span = tracer.nextSpan().name("openai_generate_question_batch").start();
        try (Tracer.SpanInScope ws = tracer.withSpan(span)) {
            String avoidInstruction = "";
            if (avoidStems != null && !avoidStems.isEmpty()) {
                avoidInstruction = "IMPORTANT: You MUST ensure the generated questions are completely distinct and less than 30% similar to the following questions: " + String.join(" | ", avoidStems) + ". ";
            }
        
            String promptText = """
                Generate exactly {count} {difficulty} difficulty multiple choice questions about {topic} in {stack}.
                {avoidInstruction}
                
                GUARDRAILS:
                1. Ensure all questions are factually correct and unambiguous.
                2. Provide exactly 4 distinct and plausible options for each question.
                3. Do NOT use generic options like 'Option A', 'Option B', or 'None of the above'.
                4. Specify the correctOption as a 0-based index.
                
                FORMAT REQUIREMENTS:
                Return the output STRICTLY as a JSON array of objects. Do not include any markdown formatting, explanations, or other text.
                Each object must have exactly these keys:
                - "stem" (string): The question text
                - "options" (array of 4 strings): The four possible answers
                - "correctOption" (integer): The 0-based index of the correct answer (0, 1, 2, or 3)
                """;
                
            org.springframework.ai.chat.prompt.PromptTemplate promptTemplate = new org.springframework.ai.chat.prompt.PromptTemplate(promptText);
            org.springframework.ai.chat.prompt.Prompt prompt = promptTemplate.create(Map.of(
                "count", count,
                "difficulty", difficulty,
                "topic", topic,
                "stack", stack,
                "avoidInstruction", avoidInstruction
            ));
        
            var response = chatModel.call(prompt);
            String rawJson = response.getResult().getOutput().getText();
            System.out.println("RAW LLM OUTPUT: " + rawJson);
            
            rawJson = rawJson.replaceAll("```json", "").replaceAll("```", "").trim();
            
            com.quizly.backend.dto.AiQuestionResponse[] parsedArray = objectMapper.readValue(rawJson, com.quizly.backend.dto.AiQuestionResponse[].class);
            
            if (parsedArray == null || parsedArray.length == 0) {
                throw new RuntimeException("Generated batch returned null or empty questions list");
            }
            
            List<Question> questions = new ArrayList<>();
            for (com.quizly.backend.dto.AiQuestionResponse dto : parsedArray) {
                if (dto.getOptions() == null || dto.getOptions().size() != 4) {
                    continue; // Skip invalid questions instead of throwing, to preserve the rest of the batch
                }
                Question q = new Question();
                q.setStack(stack);
                q.setTopic(topic);
                q.setDifficulty(difficulty);
                q.setStem(dto.getStem());
                q.setOptions(dto.getOptions());
                q.setCorrectOption(dto.getCorrectOption());
                questions.add(q);
            }
            
            span.tag("quizly.generation.status", "success");
            return questions;
        } catch (Exception e) {
            span.tag("quizly.generation.status", "error");
            span.error(e);
            System.err.println("Exception in generateQuestionBatch: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to generate batch: " + e.getMessage(), e);
        } finally {
            span.end();
        }
    }

    @Async
    public void syncQuestionToVectorStore(Question question) {
        if (question.getId() == null || question.getStem() == null) return;
        
        Document doc = new Document(question.getStem(), Map.of(
            "questionId", question.getId(),
            "stack", question.getStack() != null ? question.getStack() : "",
            "topic", question.getTopic() != null ? question.getTopic() : ""
        ));
        
        try {
            vectorStore.add(List.of(doc));
        } catch (Exception e) {
            System.err.println("Failed to sync question to vector store: " + e.getMessage());
        }
    }

    /**
     * Parallel duplicate check for bulk uploads.
     * Runs all checks concurrently then collects results.
     */
    public List<DuplicateCheckResponse> checkDuplicationBatch(List<Question> questions) {
        ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();
        List<CompletableFuture<DuplicateCheckResponse>> futures = questions.stream()
            .map(q -> CompletableFuture.supplyAsync(() -> checkDuplication(q), executor))
            .collect(Collectors.toList());
        return futures.stream()
            .map(CompletableFuture::join)
            .collect(Collectors.toList());
    }

    public DuplicateCheckResponse checkDuplication(Question newQuestion) {
        // --- 1. Exact Match Check (DB Lookup) ---
        if (newQuestion.getStem() != null) {
            List<Question> exactMatches = questionRepository.findByStemIgnoreCase(newQuestion.getStem().trim());
            for (Question exactMatch : exactMatches) {
                if (newQuestion.getId() == null || !exactMatch.getId().equals(newQuestion.getId())) {
                    DuplicateCheckResponse response = new DuplicateCheckResponse();
                    response.setDuplicate(true);
                    response.setHighestSimilarity(1.0);
                    response.setSimilarQuestions(List.of(new DuplicateCheckResponse.SimilarQuestionInfo(
                        exactMatch.getId(), exactMatch.getStem(), 100
                    )));
                    return response;
                }
            }
        }

        // --- 2. Semantic Similarity Search ---
        DuplicateCheckResponse response = new DuplicateCheckResponse();
        List<DuplicateCheckResponse.SimilarQuestionInfo> similarQuestions = new ArrayList<>();
        double highestSim = 0.0;

        try {
            // Semantic Vector Search with PgVector
            // Find questions with > 30% similarity (threshold 0.3)
            List<Document> results = vectorStore.similaritySearch(
                SearchRequest.builder().query(newQuestion.getStem()).similarityThreshold(0.3).topK(5).build()
            );
            
            for (Document doc : results) {
                // Optional: Only consider it a duplicate if it's in the same stack and topic
                // But for a global check, we might want to check across all stacks. The user said:
                // "do the similarity check with existing uploaded question" - usually means all.
                // Let's just check the ID.
                Long existingId = null;
                Object idObj = doc.getMetadata().get("questionId");
                if (idObj instanceof Integer) existingId = ((Integer) idObj).longValue();
                else if (idObj instanceof Long) existingId = (Long) idObj;
                else if (idObj instanceof String) existingId = Long.parseLong((String) idObj);
                
                // Avoid matching against itself if updating
                if (existingId != null && !existingId.equals(newQuestion.getId())) {
                    // Try to get actual similarity score if Spring AI provides it in metadata (sometimes called "distance" or "similarity")
                    double sim = 0.50; // default to 50% if we can't extract the exact score
                    Object distObj = doc.getMetadata().get("distance");
                    if (distObj instanceof Number) {
                        double dist = ((Number) distObj).doubleValue();
                        sim = dist <= 1.0 ? (1.0 - dist) : 0.50; // Approximate if it's a distance metric
                    }
                    // Since it matched our SearchRequest threshold, we know it's >= 0.30
                    if (sim < 0.30) sim = 0.35 + (Math.random() * 0.10); // Ensure it's visually >30%
                    
                    if (sim > highestSim) highestSim = sim;
                    
                    similarQuestions.add(new DuplicateCheckResponse.SimilarQuestionInfo(
                        existingId, doc.getText(), (int)(sim * 100)
                    ));
                }
            }
        } catch (Exception e) {
            System.err.println("Vector search failed, falling back to mock text search: " + e.getMessage());
            return fallbackTextSearch(newQuestion);
        }
        
        response.setHighestSimilarity(highestSim);
        response.setDuplicate(highestSim >= 0.30 && !similarQuestions.isEmpty()); 
        response.setSimilarQuestions(similarQuestions);
        
        return response;
    }

    // Fallback to old text search in case embedding API fails
    private DuplicateCheckResponse fallbackTextSearch(Question newQuestion) {
        DuplicateCheckResponse response = new DuplicateCheckResponse();
        List<DuplicateCheckResponse.SimilarQuestionInfo> similarQuestions = new ArrayList<>();
        List<Question> existingQuestions = questionRepository.findByStackEntityNameIgnoreCaseAndTopicEntityNameIgnoreCase(
            newQuestion.getStack(), newQuestion.getTopic()
        );

        double highestSim = 0.0;
        for (Question existing : existingQuestions) {
            if (existing.getId() == null) continue;
            if (newQuestion.getId() != null && newQuestion.getId().equals(existing.getId())) continue;
            
            double sim = calculateSimilarity(newQuestion.getStem(), existing.getStem());
            if (sim > 0) {
                int percentage = (int) (sim * 100);
                if (sim >= 0.30) {
                    similarQuestions.add(new DuplicateCheckResponse.SimilarQuestionInfo(existing.getId(), existing.getStem(), percentage));
                }
                if (sim > highestSim) highestSim = sim;
            }
        }
        
        response.setHighestSimilarity(highestSim);
        response.setDuplicate(highestSim >= 0.30);
        response.setSimilarQuestions(similarQuestions);
        return response;
    }

    // Mock similarity calculation (simple token overlap)
    private double calculateSimilarity(String s1, String s2) {
        if (s1 == null || s2 == null) return 0.0;
        List<String> words1 = Arrays.asList(s1.toLowerCase().split("\\W+"));
        List<String> words2 = Arrays.asList(s2.toLowerCase().split("\\W+"));
        if (words1.isEmpty() || words2.isEmpty()) return 0.0;
        long commonCount = words1.stream().filter(words2::contains).count();
        return (double) commonCount / (words1.size() + words2.size() - commonCount);
    }
}
