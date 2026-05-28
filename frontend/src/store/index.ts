import { configureStore } from '@reduxjs/toolkit';
import questionsReducer from './questionsSlice';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    questions: questionsReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
