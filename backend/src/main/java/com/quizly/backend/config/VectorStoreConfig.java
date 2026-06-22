package com.quizly.backend.config;

import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.vectorstore.SimpleVectorStore;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.File;

@Configuration
public class VectorStoreConfig {

    @Bean
    public VectorStore vectorStore(EmbeddingModel embeddingModel) {
        SimpleVectorStore vectorStore = SimpleVectorStore.builder(embeddingModel).build();
        
        // Optional: Load existing vectors on startup if the file exists
        File vectorStoreFile = new File("vectorstore.json");
        if (vectorStoreFile.exists()) {
            vectorStore.load(vectorStoreFile);
        }
        
        return vectorStore;
    }
}
