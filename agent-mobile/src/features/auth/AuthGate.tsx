import React, { useEffect, useRef } from 'react';
import { restoreSession } from '@shared/auth/restoreSession';
import { mobileTokenStorage } from '../../auth/tokenStorage';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { authApi } from '../../redux/services/authApi';
import { logout, setCredentials, tokenLoaded } from '../../redux/slices/authSlice';

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const status = useAppSelector((s) => s.auth.status);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void restoreSession({
      storage: mobileTokenStorage,
      onToken: (token) => dispatch(tokenLoaded(token)),
      fetchMe: () => dispatch(authApi.endpoints.getMe.initiate(undefined, { forceRefetch: true })).unwrap(),
      onAuthenticated: (user, token) => {
        if (user.role === 'field_agent') {
          dispatch(setCredentials({ user, token }));
        } else {
          // Only field agents use the mobile app.
          void mobileTokenStorage.clear();
          dispatch(logout());
        }
      },
      onAnonymous: () => dispatch(logout()),
    });
  }, [dispatch]);

  if (status === 'restoring') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E7ECEF] text-slate-500 text-xs font-medium" role="status">
        <span className="inline-block w-5 h-5 mr-3 border-2 border-[#274C77] border-t-transparent rounded-full animate-spin" />
        Restoring your session…
      </div>
    );
  }
  return <>{children}</>;
};
