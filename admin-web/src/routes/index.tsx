import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from '../components/layout/AdminLayout';
import { AdminLoginPage } from '../features/auth/AdminLoginPage';
import { AdminDashboardPage } from '../features/dashboard/AdminDashboardPage';
import { LeadManagementPage } from '../features/leads/LeadManagementPage';
import { AgentManagementPage } from '../features/agents/AgentManagementPage';
import { TeamManagementPage } from '../features/teams/TeamManagementPage';
import { FieldTrackingPage } from '../features/tracking/FieldTrackingPage';
import { AttendancePage } from '../features/attendance/AttendancePage';
import { CustomerVisitsPage } from '../features/visits/CustomerVisitsPage';
import { FollowupsPage } from '../features/followups/FollowupsPage';
import { OnboardingPage } from '../features/onboarding/OnboardingPage';
import { ReportsPage } from '../features/reports/ReportsPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { useAppSelector } from '../redux/hooks';

export const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  return (
    <Routes>
      <Route path="/login" element={<AdminLoginPage />} />

      {/* Protected Routes */}
      <Route
        path="/"
        element={isAuthenticated ? <AdminLayout /> : <Navigate to="/login" replace />}
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="leads" element={<LeadManagementPage />} />
        <Route path="agents" element={<AgentManagementPage />} />
        <Route path="teams" element={<TeamManagementPage />} />
        <Route path="tracking" element={<FieldTrackingPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="visits" element={<CustomerVisitsPage />} />
        <Route path="followups" element={<FollowupsPage />} />
        <Route path="onboarding" element={<OnboardingPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
