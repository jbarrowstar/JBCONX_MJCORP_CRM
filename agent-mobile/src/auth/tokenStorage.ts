import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { webTokenStorage } from '@shared/auth/tokenStorage';
import type { TokenStorage } from '@shared/auth/tokenStorage';

const KEY = 'jbconx.crm.token';

/**
 * Native app: Capacitor Preferences (survives app restarts). Browser/dev: web storage.
 * IMPORTANT: Preferences is NOT encrypted storage (SharedPreferences on Android). It is what the project
 * brief asked for; for stronger protection move to a Keystore-backed secure-storage plugin in Phase 7.
 * The native branch is untested: it requires a real Android build.
 */
export const mobileTokenStorage: TokenStorage = {
  async get() {
    if (Capacitor.isNativePlatform()) {
      const { value } = await Preferences.get({ key: KEY });
      return value;
    }
    return webTokenStorage.get();
  },
  async set(token, remember) {
    if (Capacitor.isNativePlatform()) {
      await Preferences.set({ key: KEY, value: token });
      return;
    }
    await webTokenStorage.set(token, remember);
  },
  async clear() {
    if (Capacitor.isNativePlatform()) {
      await Preferences.remove({ key: KEY });
      return;
    }
    await webTokenStorage.clear();
  },
};
