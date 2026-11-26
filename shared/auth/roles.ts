import type { UserRole } from '../types';

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  marketing_manager: 'Marketing Manager',
  team_leader: 'Team Leader',
  field_agent: 'Field Agent',
};

/** Roles that use the admin web application. Field agents use the mobile app. */
export const ADMIN_WEB_ROLES: readonly UserRole[] = ['super_admin', 'marketing_manager', 'team_leader'];

export const isAdminWebRole = (role: UserRole | undefined | null): boolean =>
  !!role && ADMIN_WEB_ROLES.includes(role);

/**
 * UI mirrors of the backend hierarchy rules (the backend remains the authority and re-checks everything).
 */
export const creatableRoles = (actor: UserRole): UserRole[] =>
  actor === 'super_admin'
    ? ['marketing_manager', 'team_leader', 'field_agent']
    : actor === 'marketing_manager'
      ? ['team_leader', 'field_agent']
      : [];

export const canManageRole = (actor: UserRole, target: UserRole): boolean => {
  if (actor === 'super_admin') return true;
  if (actor === 'marketing_manager') return target === 'team_leader' || target === 'field_agent';
  return false;
};

export const canWriteTeams = (actor: UserRole): boolean => actor === 'super_admin' || actor === 'marketing_manager';
