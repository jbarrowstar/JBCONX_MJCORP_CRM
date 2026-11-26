import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

export type LocationFailure = 'unsupported' | 'denied' | 'unavailable' | 'timeout';

export type LocationResult =
  | { ok: true; latitude: number; longitude: number; accuracy: number }
  | { ok: false; reason: LocationFailure; message: string };

const MESSAGES: Record<LocationFailure, string> = {
  unsupported: 'This device or browser cannot provide a location.',
  denied: 'Location permission was denied. Allow location access for this app in your device settings, then try again.',
  unavailable: 'Your location could not be determined. Move to an open area and try again.',
  timeout: 'Finding your location took too long. Try again.',
};

const fail = (reason: LocationFailure): LocationResult => ({ ok: false, reason, message: MESSAGES[reason] });

const classify = (e: unknown): LocationFailure => {
  const code = (e as { code?: number | string })?.code;
  const msg = String((e as { message?: string })?.message ?? '').toLowerCase();
  if (code === 1 || code === 'PERMISSION_DENIED' || msg.includes('denied') || msg.includes('permission')) return 'denied';
  if (code === 3 || msg.includes('timeout') || msg.includes('timed out')) return 'timeout';
  return 'unavailable';
};

/**
 * One real GPS fix, or an explicit failure. Never returns invented coordinates.
 * Native (Capacitor) path is implemented but NOT yet exercised on a device (Phase 7); the browser path is tested.
 */
export const getCurrentLocation = async (timeoutMs = 15000): Promise<LocationResult> => {
  try {
    if (Capacitor.isNativePlatform()) {
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: timeoutMs });
      return { ok: true, latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy };
    }
    if (typeof navigator === 'undefined' || !navigator.geolocation) return fail('unsupported');
    return await new Promise<LocationResult>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ ok: true, latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy }),
        (err) => resolve(fail(classify(err))),
        { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 }
      );
    });
  } catch (e) {
    return fail(classify(e));
  }
};
