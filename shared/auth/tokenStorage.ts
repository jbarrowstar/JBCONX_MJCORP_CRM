/**
 * Where the JWT lives between page loads.
 * - Web: sessionStorage by default, localStorage when the user ticks "remember this device".
 * - Mobile (Capacitor): an adapter over @capacitor/preferences lives in the mobile app.
 * NOTE: neither is encrypted storage. Anything readable by script on the page (XSS) can read the token,
 * so keep third-party scripts out of the apps and keep the CSP tight.
 */
export interface TokenStorage {
  get(): Promise<string | null>;
  set(token: string, remember: boolean): Promise<void>;
  clear(): Promise<void>;
}

const KEY = 'jbconx.crm.token';

const safe = <T,>(fn: () => T, fallback: T): T => {
  try {
    return fn();
  } catch {
    return fallback; // storage can be unavailable (private mode, blocked)
  }
};

export const webTokenStorage: TokenStorage = {
  async get() {
    return safe(() => window.localStorage.getItem(KEY) ?? window.sessionStorage.getItem(KEY), null);
  },
  async set(token, remember) {
    safe(() => {
      window.localStorage.removeItem(KEY);
      window.sessionStorage.removeItem(KEY);
      (remember ? window.localStorage : window.sessionStorage).setItem(KEY, token);
    }, undefined);
  },
  async clear() {
    safe(() => {
      window.localStorage.removeItem(KEY);
      window.sessionStorage.removeItem(KEY);
    }, undefined);
  },
};
