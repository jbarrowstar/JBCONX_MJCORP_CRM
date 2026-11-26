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
  /** sidebar section the item is listed under */
  group: NavGroup;
}

export type NavGroup = 'Overview' | 'Sales' | 'Field force' | 'Administration';
export const NAV_GROUPS: NavGroup[] = ['Overview', 'Sales', 'Field force', 'Administration'];

const MGMT: UserRole[] = ['super_admin', 'marketing_manager', 'team_leader'];

export const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, roles: MGMT, live: true, group: 'Overview' },
  { name: 'Lead Management', path: '/admin/leads', icon: Users, roles: MGMT, live: true, group: 'Sales' },
  { name: 'Staff Management', path: '/admin/staff', icon: UserCheck, roles: MGMT, live: true, group: 'Field force' },
  { name: 'Team Management', path: '/admin/teams', icon: Network, roles: MGMT, live: true, group: 'Field force' },
  { name: 'Field Tracking', path: '/admin/tracking', icon: MapPin, roles: MGMT, live: false, phase: 'Phase 8', group: 'Field force' },
  { name: 'Visits & Attendance', path: '/admin/attendance', icon: Clock, roles: MGMT, live: true, group: 'Field force' },
  { name: 'Follow-ups & Tasks', path: '/admin/followups', icon: CheckSquare, roles: MGMT, live: true, group: 'Sales' },
  { name: 'Customer Visits', path: '/admin/visits', icon: CalendarCheck, roles: MGMT, live: true, group: 'Sales' },
  { name: 'Registration & Onboarding', path: '/admin/onboarding', icon: FileCheck2, roles: MGMT, live: false, phase: 'Phase 8', group: 'Administration' },
  { name: 'Reports & Analytics', path: '/admin/reports', icon: BarChart3, roles: MGMT, live: true, group: 'Overview' },
  { name: 'Settings', path: '/admin/settings', icon: Settings, roles: ['super_admin', 'marketing_manager'], live: false, phase: 'Phase 9', group: 'Administration' },
];

export const navItemFor = (pathname: string): NavItem | undefined =>
  NAV_ITEMS.find((i) => pathname === i.path || pathname.startsWith(i.path + '/'));
