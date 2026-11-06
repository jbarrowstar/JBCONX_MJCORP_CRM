import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '@shared/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: {
    id: 'usr_mock_agent_1',
    name: 'David Miller',
    email: 'david.miller@jbconx.com',
    role: 'FIELD_AGENT',
    teamId: 'team_alpha',
    teamName: 'Northern Enterprise Squad',
    createdAt: new Date().toISOString()
  },
  token: 'mock-jwt-token-agent',
  isAuthenticated: true,
  isLoading: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    }
  },
});

export const { setCredentials, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;

