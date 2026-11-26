import type { User } from '../types';
import type { TokenStorage } from './tokenStorage';

interface Deps {
  storage: TokenStorage;
  /** Validates the token on the server and returns the current user (throws when invalid). */
  fetchMe: () => Promise<User>;
  onToken: (token: string) => void;
  onAuthenticated: (user: User, token: string) => void;
  onAnonymous: () => void;
}

/** Runs once at app start: no stored token -> anonymous; token -> must be accepted by the server. */
export const restoreSession = async ({ storage, fetchMe, onToken, onAuthenticated, onAnonymous }: Deps): Promise<void> => {
  const token = await storage.get();
  if (!token) {
    onAnonymous();
    return;
  }
  onToken(token);
  try {
    const user = await fetchMe();
    onAuthenticated(user, token);
  } catch {
    await storage.clear();
    onAnonymous();
  }
};
