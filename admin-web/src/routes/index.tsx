import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { isAdminWebRole } from '@shared/auth/roles';
import { useAppSelector } from '../redux/hooks';

import { LoginPage } from '../features/auth/LoginPage';
import { RequireRole } from '../features/auth/RequireRole';
import { AdminLayout } from '../components/layout/AdminLayout';

import { AdminDashboardPage } from '../features/dashboard/AdminDashboardPage';
import { LeadManagementPage } from '../features/leads/LeadManagementPage';
import { StaffManagementPage } from '../features/staff/StaffManagementPage';
import { TeamManagementPage } from '../features/teams/TeamManagementPage';
import { FieldTrackingPage } from '../features/tracking/FieldTrackingPage';
import { AttendancePage } from '../features/attendance/AttendancePage';
import { CustomerVisitsPage } from '../features/visits/CustomerVisitsPage';
import { FollowupsPage } from '../features/followups/FollowupsPage';
import { OnboardingPage } from '../features/onboarding/OnboardingPage';
import { ReportsPage } from '../features/reports/ReportsPage';
import { SettingsPage } from '../features/settings/SettingsPage';

export const AppRoutes: React.FC = () => {
  const { user, status } = useAppSelector((s) => s.auth);
  const signedIn = status === 'authenticated' && !!user && isAdminWebRole(user.role);

  return (
    <Routes>
      <Route path="/login" element={signedIn ? <Navigate to="/admin/dashboard" replace /> : <LoginPage />} />

      {/* Everything under /admin requires a signed-in management role. Field agents use the mobile app. */}
      <Route path="/admin" element={<RequireRole roles={['super_admin', 'marketing_manager', 'team_leader']} children={<AdminLayout />} />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="leads" element={<LeadManagementPage />} />
        <Route path="staff" element={<StaffManagementPage />} />
        <Route path="agents" element={<Navigate to="/admin/staff" replace />} />
        <Route path="teams" element={<TeamManagementPage />} />
        <Route path="tracking" element={<FieldTrackingPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="visits" element={<CustomerVisitsPage />} />
        <Route path="followups" element={<FollowupsPage />} />
        <Route path="onboarding" element={<OnboardingPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route
          path="settings"
          element={
            <RequireRole roles={['super_admin', 'marketing_manager']}>
              <SettingsPage />
            </RequireRole>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to={signedIn ? '/admin/dashboard' : '/login'} replace />} />
    </Routes>
  );
};
