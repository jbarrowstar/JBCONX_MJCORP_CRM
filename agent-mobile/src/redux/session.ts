import { mobileTokenStorage } from '../auth/tokenStorage';
import { authApi } from './services/authApi';
import { baseApi } from './services/baseApi';
import { logout } from './slices/authSlice';
import type { AppDispatch } from './store';

/** Revoke the token on the server (best effort) and always wipe local state. */
export const signOut = async (dispatch: AppDispatch): Promise<void> => {
  try {
    await dispatch(authApi.endpoints.logoutRequest.initiate()).unwrap();
  } catch {
    /* token may already be invalid or the server unreachable */
  }
  await mobileTokenStorage.clear();
  dispatch(logout());
  dispatch(baseApi.util.resetApiState());
};
