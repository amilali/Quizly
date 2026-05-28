import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface AuthState {
  isAuthenticated: boolean;
  role: 'SME' | 'Admin' | null;
  userName: string | null;
}

const token = localStorage.getItem('token');
const savedRole = localStorage.getItem('role') as 'SME' | 'Admin' | null;
const savedUserName = localStorage.getItem('userName');

const initialState: AuthState = {
  isAuthenticated: !!token,
  role: savedRole || null,
  userName: savedUserName || null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<{ role: 'SME' | 'Admin', userName: string }>) => {
      state.isAuthenticated = true;
      state.role = action.payload.role;
      state.userName = action.payload.userName;
      localStorage.setItem('role', action.payload.role);
      localStorage.setItem('userName', action.payload.userName);
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.role = null;
      state.userName = null;
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('userName');
    },
  }
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
