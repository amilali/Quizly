import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface Question {
  id: string;
  stem: string;
  stack: string;
  topic: string;
  difficulty: string;
  status: string;
  options?: string[];
  correctOption?: number;
  creatorId?: string;
  reviewerId?: string;
}

const initialState: { list: Question[] } = {
  list: [
    { id: "1001", stem: "Alex is building a microservices-based system using Spring Boot...", stack: "Spring Boot", topic: "Spring Boot Introduction", difficulty: "Medium", status: "Ready for Review", options: ["Option A", "Option B", "Option C", "Option D"], correctOption: 0, creatorId: "bhola.gaurav" },
    { id: "1002", stem: "John has multiple instances of a service running dynamically...", stack: "Spring Cloud", topic: "Spring Cloud OpenFeign", difficulty: "Medium", status: "Approved", options: ["Option A", "Option B", "Option C", "Option D"], correctOption: 1, creatorId: "swati.nikam", reviewerId: "bhola.gaurav" },
    { id: "1003", stem: "What is the purpose of Spring Boot Starters?", stack: "Spring Boot", topic: "Spring Boot Starters", difficulty: "Easy", status: "Under Review", options: ["To bootstrap Spring applications", "To connect to databases", "To manage security", "To create REST controllers"], correctOption: 0, creatorId: "bhola.gaurav", reviewerId: "admin.user" },
    { id: "1004", stem: "Does the @SpringBootApplication annotation combine internally?", stack: "Spring Boot", topic: "SpringBootApplication annotation", difficulty: "Medium", status: "Rejected", options: ["Yes, @Configuration, @EnableAutoConfiguration, @ComponentScan", "No, it's a standalone annotation", "Yes, @Controller, @Service, @Repository", "Only @Configuration and @ComponentScan"], correctOption: 0, creatorId: "divya.madhnasekar", reviewerId: "bhola.gaurav" },
    { id: "1005", stem: "Which component is used for client-side load balancing in Spring Cloud?", stack: "Spring Cloud", topic: "Spring Cloud LoadBalancer", difficulty: "Medium", status: "Draft", options: ["Spring Cloud Gateway", "Spring Cloud LoadBalancer", "Eureka Server", "Config Server"], correctOption: 1, creatorId: "indugu.hariprasad" }
  ]
};

const questionsSlice = createSlice({
  name: 'questions',
  initialState,
  reducers: {
    addQuestion: (state, action: PayloadAction<Question>) => {
      state.list.unshift(action.payload);
    },
    addQuestionsBulk: (state, action: PayloadAction<Question[]>) => {
      state.list = [...action.payload, ...state.list];
    },
    updateQuestion: (state, action: PayloadAction<Question>) => {
      const index = state.list.findIndex(q => q.id === action.payload.id);
      if (index !== -1) {
        state.list[index] = action.payload;
      }
    },
    deleteQuestion: (state, action: PayloadAction<string>) => {
      state.list = state.list.filter(q => q.id !== action.payload);
    },
    assignReviewer: (state, action: PayloadAction<{ id: string, reviewerId: string }>) => {
      const index = state.list.findIndex(q => q.id === action.payload.id);
      if (index !== -1) {
        state.list[index].reviewerId = action.payload.reviewerId;
        state.list[index].status = "Under Review";
      }
    }
  }
});

export const { addQuestion, addQuestionsBulk, updateQuestion, deleteQuestion, assignReviewer } = questionsSlice.actions;
export default questionsSlice.reducer;
