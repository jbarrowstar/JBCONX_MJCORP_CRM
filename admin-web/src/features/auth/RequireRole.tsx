import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { UserRole } from '@shared/types';
import { useAppSelector } from '../../redux/hooks';

/** Route guard: must be signed in, and (optionally) hold one of the given roles. */
export const RequireRole: React.FC<{ roles?: UserRole[]; children?: React.ReactNode }> = ({ roles, children }) => {
  const { user, status } = useAppSelector((s) => s.auth);
  const location = useLocation();

  if (status !== 'authenticated' || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <>{children ?? <Outlet />}</>;
};
