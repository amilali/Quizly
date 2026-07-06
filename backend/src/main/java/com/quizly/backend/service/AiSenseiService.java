package com.quizly.backend.service;

import com.quizly.backend.tool.WebSearchTool;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.V;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.List;

@Service
public class AiSenseiService {

    @Value("${spring.ai.openai.api-key}")
    private String openRouterApiKey;

    private AiSenseiAgent searchAgent;
    private AiSenseiAgent thinkAgent;

    private final WebSearchTool webSearchTool;

    public AiSenseiService(WebSearchTool webSearchTool) {
        this.webSearchTool = webSearchTool;
    }

    @PostConstruct
    public void init() {
        ChatLanguageModel chatModel = OpenAiChatModel.builder()
                .baseUrl("https://openrouter.ai/api/v1")
                .apiKey(openRouterApiKey)
                .modelName("openai/gpt-4o-mini") 
                .logRequests(true)
                .logResponses(true)
                .build();

        // Search agent — has web search tool access
        this.searchAgent = AiServices.builder(AiSenseiAgent.class)
                .chatLanguageModel(chatModel)
                .chatMemory(MessageWindowChatMemory.withMaxMessages(10))
                .tools(webSearchTool)
                .build();

        // Think agent — no tools, pure reasoning
        this.thinkAgent = AiServices.builder(AiSenseiAgent.class)
                .chatLanguageModel(chatModel)
                .chatMemory(MessageWindowChatMemory.withMaxMessages(10))
                .build();
    }

    public String chat(String userMessage, String mode, List<String> mcpServers) {
        try {
            String finalMessage = userMessage;
            if (mcpServers != null && !mcpServers.isEmpty()) {
                finalMessage += "\n\n[System Info: The user has enabled the following MCP (Model Context Protocol) connections for this session: " 
                        + String.join(", ", mcpServers) 
                        + ". You can assume you have access to information from these systems if relevant.]";
            }
            
            if ("search".equalsIgnoreCase(mode)) {
                return searchAgent.chat(finalMessage);
            } else {
                return thinkAgent.chat(finalMessage);
            }
        } catch (Exception e) {
            return "I encountered an error processing your request: " + e.getMessage();
        }
    }

    interface AiSenseiAgent {
        @SystemMessage("""
            You are AI Sensei, an intelligent and helpful assistant for Quizly — a quiz platform by Accenture L&TT.
            
            When the user asks about current events, latest news, or real-time information, USE your web search tool to find accurate, up-to-date answers.
            
            For general knowledge, coding help, explanations, and reasoning tasks, answer directly from your knowledge.
            
            Always format your responses using Markdown:
            - Use **bold** for emphasis
            - Use bullet points and numbered lists for structured information
            - Use `code` for inline code and ```code blocks``` for code snippets
            - Use headings (## , ###) to organize long responses
            
            Be concise, helpful, and accurate.
            """)
        String chat(String userMessage);
    }
}
