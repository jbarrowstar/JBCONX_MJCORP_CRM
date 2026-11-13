import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from '../redux/hooks';

// Auth
import { UnifiedLoginPage } from '../features/auth/UnifiedLoginPage';

// Layouts
import { AdminLayout } from '../components/layout/AdminLayout';
import { MobileLayout } from '../components/mobile/layout/MobileLayout';

// Admin Features
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

// Agent Features
import { AgentDashboardPage } from '../features/agent/dashboard/AgentDashboardPage';
import { AgentLeadsPage } from '../features/agent/leads/AgentLeadsPage';
import { AgentAttendancePage } from '../features/agent/attendance/AgentAttendancePage';
import { AgentVisitsPage } from '../features/agent/visits/AgentVisitsPage';
import { AgentProfilePage } from '../features/agent/profile/AgentProfilePage';

export const AppRoutes: React.FC = () => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  // Role Checks
  const isAdmin = isAuthenticated && user?.role === 'ADMIN';
  const isAgent = isAuthenticated && user?.role === 'AGENT';

  return (
    <Routes>
      {/* Unified Login Route */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            user?.role === 'ADMIN' ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <Navigate to="/agent/dashboard" replace />
            )
          ) : (
            <UnifiedLoginPage />
          )
        }
      />

      {/* Admin Role Guarded Workspace */}
      <Route
        path="/admin"
        element={
          isAdmin ? (
            <AdminLayout />
          ) : isAgent ? (
            <Navigate to="/agent/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
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

      {/* Agent Role Guarded Workspace */}
      <Route
        path="/agent"
        element={
          isAgent ? (
            <MobileLayout />
          ) : isAdmin ? (
            <Navigate to="/admin/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      >
        <Route index element={<Navigate to="/agent/dashboard" replace />} />
        <Route path="dashboard" element={<AgentDashboardPage />} />
        <Route path="leads" element={<AgentLeadsPage />} />
        <Route path="attendance" element={<AgentAttendancePage />} />
        <Route path="visits" element={<AgentVisitsPage />} />
        <Route path="profile" element={<AgentProfilePage />} />
      </Route>

      {/* Root redirect depending on role */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            user?.role === 'ADMIN' ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <Navigate to="/agent/dashboard" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Catch-all */}
      <Route
        path="*"
        element={
          isAuthenticated ? (
            user?.role === 'ADMIN' ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <Navigate to="/agent/dashboard" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
};
