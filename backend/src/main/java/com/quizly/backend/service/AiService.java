package com.quizly.backend.service;

import com.quizly.backend.dto.DuplicateCheckResponse;
import com.quizly.backend.dto.GenerateRequest;
import com.quizly.backend.model.Question;
import com.quizly.backend.repository.QuestionRepository;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

import io.micrometer.tracing.Tracer;
import io.micrometer.tracing.Span;

@Service
public class AiService {

    private final QuestionRepository questionRepository;
    private final ChatModel chatModel;
    private final Tracer tracer;
    private final EmbeddingService embeddingService;

    public AiService(QuestionRepository questionRepository, ChatModel chatModel,
                     Tracer tracer, EmbeddingService embeddingService) {
        this.questionRepository = questionRepository;
        this.chatModel = chatModel;
        this.tracer = tracer;
        this.embeddingService = embeddingService;
    }


    @jakarta.annotation.PostConstruct
    public void initVectorStore() {
        // Vector store disabled — using text-based duplicate search
        System.out.println("Vector Store skipped — using text-based duplicate detection.");
    }

    // Ordered list of free OpenRouter models to try. Lightest/fastest first.
    // Falls through to the next if the current model is rate-limited (429).
    private static final List<String> FALLBACK_MODELS = List.of(
        "liquid/lfm-2.5-1.2b-instruct:free",            // 1.2B — fastest
        "meta-llama/llama-3.2-3b-instruct:free",         // 3B — fast
        "nvidia/nemotron-nano-9b-v2:free",               // 9B — balanced
        "meta-llama/llama-3.3-70b-instruct:free",        // 70B — high quality
        "qwen/qwen3-next-80b-a3b-instruct:free",         // 80B MoE — high quality
        "google/gemma-4-26b-a4b-it:free",               // 26B — Google
        "nousresearch/hermes-3-llama-3.1-405b:free"      // 405B — last resort
    );

    public List<Question> generateQuestions(GenerateRequest request, String creatorId) {
        Span span = tracer.nextSpan().name("ai_generate_questions").start();
        try (Tracer.SpanInScope ws = tracer.withSpan(span)) {
            span.tag("quizly.request.count", String.valueOf(request.getCount()));
            span.tag("quizly.request.topic", request.getTopic() != null ? request.getTopic() : "unknown");

            // Try each model in the fallback chain until one succeeds
            Exception lastError = null;
            for (String model : FALLBACK_MODELS) {
                try {
                    System.out.println("Trying model: " + model);
                    List<Question> questions = generateQuestionBatch(
                        model, request.getStack(), request.getTopic(),
                        request.getDifficulty(), request.getCount(), request.getAvoidStems()
                    );
                    if (questions != null && !questions.isEmpty()) {
                        questions.forEach(q -> {
                            q.setCreatorId(creatorId);
                            q.setStatus("Draft");
                        });
                        span.tag("quizly.model.used", model);
                        System.out.println("Success with model: " + model);
                        return questions;
                    }
                } catch (Exception e) {
                    System.err.println("Model " + model + " failed: " + e.getMessage());
                    lastError = e;
                    // Continue to next model
                }
            }

            System.err.println("All models failed. Last error: " + (lastError != null ? lastError.getMessage() : "unknown"));
            return new ArrayList<>();
        } finally {
            span.end();
        }
    }

    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();

    private List<Question> generateQuestionBatch(String model, String stack, String topic, String difficulty, int count, java.util.List<String> avoidStems) {
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

            // Override model per-call using ChatOptions
            org.springframework.ai.chat.prompt.Prompt finalPrompt = new org.springframework.ai.chat.prompt.Prompt(
                prompt.getInstructions(),
                org.springframework.ai.openai.OpenAiChatOptions.builder().model(model).build()
            );

            var response = chatModel.call(finalPrompt);
            String rawJson = response.getResult().getOutput().getText();
            System.out.println("RAW LLM OUTPUT (" + model + "): " + rawJson);

            rawJson = rawJson.replaceAll("```json", "").replaceAll("```", "").trim();

            // Extract JSON array if model wrapped it in extra text
            int start = rawJson.indexOf('[');
            int end = rawJson.lastIndexOf(']');
            if (start >= 0 && end > start) {
                rawJson = rawJson.substring(start, end + 1);
            }

            com.quizly.backend.dto.AiQuestionResponse[] parsedArray = objectMapper.readValue(rawJson, com.quizly.backend.dto.AiQuestionResponse[].class);

            if (parsedArray == null || parsedArray.length == 0) {
                throw new RuntimeException("Generated batch returned null or empty questions list");
            }

            List<Question> questions = new ArrayList<>();
            for (com.quizly.backend.dto.AiQuestionResponse dto : parsedArray) {
                if (dto.getOptions() == null || dto.getOptions().size() != 4) {
                    continue;
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
            throw new RuntimeException("Failed to generate batch: " + e.getMessage(), e);
        } finally {
            span.end();
        }
    }

    @Async
    public void syncQuestionToVectorStore(Question question) {
        // Vector store disabled — no-op
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

        // --- 2. Semantic similarity via HF embeddings (if configured) ---
        float[] newEmbedding = embeddingService.embed(newQuestion.getStem());
        if (newEmbedding != null) {
            return semanticSearch(newQuestion, newEmbedding);
        }

        // --- 3. Fallback: text-based Jaccard similarity ---
        return fallbackTextSearch(newQuestion);
    }

    private DuplicateCheckResponse semanticSearch(Question newQuestion, float[] newEmbedding) {
        DuplicateCheckResponse response = new DuplicateCheckResponse();
        List<DuplicateCheckResponse.SimilarQuestionInfo> similarQuestions = new ArrayList<>();
        List<Question> existingQuestions = questionRepository.findByStackEntityNameIgnoreCaseAndTopicEntityNameIgnoreCase(
            newQuestion.getStack(), newQuestion.getTopic()
        );

        double highestSim = 0.0;
        for (Question existing : existingQuestions) {
            if (existing.getId() == null) continue;
            if (newQuestion.getId() != null && newQuestion.getId().equals(existing.getId())) continue;

            float[] existingEmb = embeddingService.embed(existing.getStem());
            double sim = embeddingService.cosineSimilarity(newEmbedding, existingEmb);

            if (sim >= 0.75) { // 75% cosine similarity = likely duplicate
                similarQuestions.add(new DuplicateCheckResponse.SimilarQuestionInfo(
                    existing.getId(), existing.getStem(), (int)(sim * 100)
                ));
                if (sim > highestSim) highestSim = sim;
            }
        }

        response.setHighestSimilarity(highestSim);
        response.setDuplicate(highestSim >= 0.75 && !similarQuestions.isEmpty());
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
