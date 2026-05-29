import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
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

export const fetchQuestions = createAsyncThunk('questions/fetchQuestions', async () => {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/questions', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) throw new Error('Failed to fetch questions');
  const data = await response.json();
  return data.map((q: any) => ({ ...q, id: String(q.id) }));
});

export const createQuestion = createAsyncThunk('questions/createQuestion', async (question: Omit<Question, 'id'>) => {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/questions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(question)
  });
  if (!response.ok) throw new Error('Failed to create question');
  const data = await response.json();
  return { ...data, id: String(data.id) };
});

export const createQuestionsBulk = createAsyncThunk('questions/createQuestionsBulk', async (questions: Omit<Question, 'id'>[]) => {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/questions/bulk', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(questions)
  });
  if (!response.ok) throw new Error('Failed to upload bulk questions');
  const data = await response.json();
  return data.map((q: any) => ({ ...q, id: String(q.id) }));
});

export const editQuestion = createAsyncThunk('questions/editQuestion', async (question: Question) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/questions/${question.id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(question)
  });
  if (!response.ok) throw new Error('Failed to update question');
  const data = await response.json();
  return { ...data, id: String(data.id) };
});

interface QuestionsState {
  list: Question[];
  isLoading: boolean;
  error: string | null;
}

const initialState: QuestionsState = {
  list: [],
  isLoading: true, // Start true so we can show shimmer immediately
  error: null
};

const questionsSlice = createSlice({
  name: 'questions',
  initialState,
  reducers: {
    deleteQuestion: (state, action: PayloadAction<string>) => {
      state.list = state.list.filter(q => q.id !== action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuestions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchQuestions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.list = action.payload;
      })
      .addCase(fetchQuestions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch questions';
      })
      .addCase(createQuestion.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })
      .addCase(createQuestionsBulk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createQuestionsBulk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.list = [...action.payload, ...state.list];
      })
      .addCase(createQuestionsBulk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to upload bulk questions';
      })
      .addCase(editQuestion.fulfilled, (state, action) => {
        const index = state.list.findIndex(q => q.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
      });
  }
});

export const { deleteQuestion } = questionsSlice.actions;
export default questionsSlice.reducer;
