import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface AuthState {
  isAuthenticated: boolean;
  role: 'SME' | 'Admin' | null;
  userName: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  role: null,
  userName: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<{ role: 'SME' | 'Admin', userName: string }>) => {
      state.isAuthenticated = true;
      state.role = action.payload.role;
      state.userName = action.payload.userName;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.role = null;
      state.userName = null;
    },
  }
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
