import { webTokenStorage } from '@shared/auth/tokenStorage';
import { logout } from './slices/authSlice';
import { baseApi } from './services/baseApi';
import { authApi } from './services/authApi';
import type { AppDispatch } from './store';

/**
 * Sign out: ask the server to revoke the token (best effort), then wipe local state.
 * Local state is cleared even if the network call fails, so a user is never stuck "logged in".
 */
export const signOut = async (dispatch: AppDispatch): Promise<void> => {
  try {
    await dispatch(authApi.endpoints.logoutRequest.initiate()).unwrap();
  } catch {
    /* token may already be invalid or the server unreachable */
  }
  await webTokenStorage.clear();
  dispatch(logout());
  dispatch(baseApi.util.resetApiState());
};
