// Auth state lives in the shared package so the admin web and the agent mobile app behave identically.
import authReducer, { tokenLoaded, setCredentials, userUpdated, tokenRotated, logout, resetAuth } from '@shared/auth/authSlice';

export { tokenLoaded, setCredentials, userUpdated, tokenRotated, logout, resetAuth };
export type { AuthState, AuthStatus } from '@shared/auth/authSlice';
export default authReducer;
