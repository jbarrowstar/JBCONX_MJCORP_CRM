import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../types';

export type AuthStatus = 'restoring' | 'authenticated' | 'anonymous';

export interface AuthState {
  user: User | null;
  token: string | null;
  status: AuthStatus;
  /** Derived convenience flag kept for existing components. */
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  status: 'restoring',
  isAuthenticated: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** A stored token was found; it is being validated against the server. */
    tokenLoaded: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      state.status = 'restoring';
      state.isAuthenticated = false;
    },
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.status = 'authenticated';
      state.isAuthenticated = true;
    },
    userUpdated: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    tokenRotated: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
    /** Back to the pristine start-up state. Used by tests that reuse one store between cases. */
    resetAuth: () => initialState,
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.status = 'anonymous';
      state.isAuthenticated = false;
    },
  },
});

export const { tokenLoaded, setCredentials, userUpdated, tokenRotated, logout, resetAuth } = authSlice.actions;
export default authSlice.reducer;
