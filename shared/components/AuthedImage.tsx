import React, { useEffect, useState } from 'react';
import { MOCK_API_ENABLED } from '../mock/mockMode';

/**
 * Private documents/photos are only served to signed-in users, so an <img src> cannot fetch them directly.
 * This loads the bytes with the bearer token and shows them through a temporary object URL.
 */
export const AuthedImage: React.FC<{ url: string; token: string | null; alt: string; className?: string }> = ({ url, token, alt, className }) => {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    setSrc(null);
    setFailed(false);
    (async () => {
      try {
        // DEVELOPMENT-ONLY: photos uploaded in mock mode live in memory, not on a server.
        if (import.meta.env.DEV && MOCK_API_ENABLED && url.includes('/__mock__/')) {
          const { getMockPhotoUrl } = await import('../mock/mockBackend');
          const mockUrl = getMockPhotoUrl(url.slice(url.indexOf('/__mock__/')));
          if (!mockUrl) throw new Error('mock photo not available');
          if (!cancelled) setSrc(mockUrl);
          return;
        }
        const res = await fetch(url, { headers: token ? { authorization: `Bearer ${token}` } : {} });
        if (!res.ok) throw new Error(String(res.status));
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) setSrc(objectUrl);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url, token]);

  if (failed) return <div className={`flex items-center justify-center bg-slate-100 text-[10px] text-slate-400 ${className ?? ''}`}>Unavailable</div>;
  if (!src) return <div className={`animate-pulse bg-slate-100 ${className ?? ''}`} aria-label="Loading photo" />;
  return <img src={src} alt={alt} className={className} />;
};
