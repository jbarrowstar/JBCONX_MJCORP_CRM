import type React from 'react';
import {
  LayoutDashboard, Users, UserCheck, Network, MapPin, Clock, CalendarCheck, CheckSquare, FileCheck2, BarChart3, Settings,
} from 'lucide-react';
import type { UserRole } from '@shared/types';

export interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  roles: UserRole[];
  /** true once the screen reads real backend data */
  live: boolean;
  /** planned phase for screens that are still previews */
  phase?: string;
}

const MGMT: UserRole[] = ['super_admin', 'marketing_manager', 'team_leader'];

export const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, roles: MGMT, live: true },
  { name: 'Lead Management', path: '/admin/leads', icon: Users, roles: MGMT, live: true },
  { name: 'Staff Management', path: '/admin/staff', icon: UserCheck, roles: MGMT, live: true },
  { name: 'Team Management', path: '/admin/teams', icon: Network, roles: MGMT, live: true },
  { name: 'Field Tracking', path: '/admin/tracking', icon: MapPin, roles: MGMT, live: false, phase: 'Phase 8' },
  { name: 'Visits & Attendance', path: '/admin/attendance', icon: Clock, roles: MGMT, live: true },
  { name: 'Follow-ups & Tasks', path: '/admin/followups', icon: CheckSquare, roles: MGMT, live: true },
  { name: 'Customer Visits', path: '/admin/visits', icon: CalendarCheck, roles: MGMT, live: true },
  { name: 'Registration & Onboarding', path: '/admin/onboarding', icon: FileCheck2, roles: MGMT, live: false, phase: 'Phase 8' },
  { name: 'Reports & Analytics', path: '/admin/reports', icon: BarChart3, roles: MGMT, live: true },
  { name: 'Settings', path: '/admin/settings', icon: Settings, roles: ['super_admin', 'marketing_manager'], live: false, phase: 'Phase 9' },
];

export const navItemFor = (pathname: string): NavItem | undefined =>
  NAV_ITEMS.find((i) => pathname === i.path || pathname.startsWith(i.path + '/'));
