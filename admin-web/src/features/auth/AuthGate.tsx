import React, { useEffect, useRef } from 'react';
import { restoreSession } from '@shared/auth/restoreSession';
import { isAdminWebRole } from '@shared/auth/roles';
import { webTokenStorage } from '@shared/auth/tokenStorage';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { authApi } from '../../redux/services/authApi';
import { logout, setCredentials, tokenLoaded } from '../../redux/slices/authSlice';
import { Spinner } from '../../components/common/States';

/** Blocks the app until a stored session (if any) has been validated by the server. */
export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const status = useAppSelector((s) => s.auth.status);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // React StrictMode runs effects twice in development
    started.current = true;
    void restoreSession({
      storage: webTokenStorage,
      onToken: (token) => dispatch(tokenLoaded(token)),
      fetchMe: () => dispatch(authApi.endpoints.getMe.initiate(undefined, { forceRefetch: true })).unwrap(),
      onAuthenticated: (user, token) => {
        if (isAdminWebRole(user.role)) {
          dispatch(setCredentials({ user, token }));
        } else {
          // A field agent token must never open the admin web.
          void webTokenStorage.clear();
          dispatch(logout());
        }
      },
      onAnonymous: () => dispatch(logout()),
    });
  }, [dispatch]);

  if (status === 'restoring') return <Spinner label="Restoring your session…" />;
  return <>{children}</>;
};
