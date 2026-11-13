import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { AgentLoginPage } from '../features/auth/AgentLoginPage';
import { AgentDashboardPage } from '../features/dashboard/AgentDashboardPage';
import { AgentLeadsPage } from '../features/leads/AgentLeadsPage';
import { AgentAttendancePage } from '../features/attendance/AgentAttendancePage';
import { AgentVisitsPage } from '../features/visits/AgentVisitsPage';
import { AgentProfilePage } from '../features/profile/AgentProfilePage';
import { useAppSelector } from '../redux/hooks';

export const AppRoutes: React.FC = () => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  // Guard: User must be authenticated and have AGENT role
  const isAuthorizedAgent = isAuthenticated && user?.role === 'AGENT';

  return (
    <Routes>
      <Route path="/login" element={<AgentLoginPage />} />

      {/* Protected Mobile Routes */}
      <Route
        path="/"
        element={
          isAuthorizedAgent ? (
            <MobileLayout />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<AgentDashboardPage />} />
        <Route path="leads" element={<AgentLeadsPage />} />
        <Route path="attendance" element={<AgentAttendancePage />} />
        <Route path="visits" element={<AgentVisitsPage />} />
        <Route path="profile" element={<AgentProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
