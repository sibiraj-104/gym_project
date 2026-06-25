// ============================================================
// GymFuel — Role Constants & Permissions Map
// ============================================================

import { UserRole } from '../types/user.types';

/** Human-readable labels for each role */
export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.USER]: 'Member',
  [UserRole.ADMIN]: 'Super Admin',
  [UserRole.SUPPORT]: 'Support Agent',
  [UserRole.DEVELOPER]: 'Developer',
};

/** Which roles can access admin panel routes */
export const ADMIN_ROLES: UserRole[] = [
  UserRole.ADMIN,
  UserRole.SUPPORT,
  UserRole.DEVELOPER,
];

/** Permissions map — which roles can perform which actions */
export const ROLE_PERMISSIONS = {
  banUser: [UserRole.ADMIN],
  deleteUser: [UserRole.ADMIN],
  viewUsers: [UserRole.ADMIN, UserRole.SUPPORT, UserRole.DEVELOPER],
  manageFood: [UserRole.ADMIN, UserRole.DEVELOPER],
  viewAnalytics: [UserRole.ADMIN, UserRole.DEVELOPER],
  manageWorkoutTemplates: [UserRole.ADMIN, UserRole.DEVELOPER],
  sendNotifications: [UserRole.ADMIN],
  viewApiMonitor: [UserRole.ADMIN, UserRole.DEVELOPER],
  manageFeatureFlags: [UserRole.ADMIN, UserRole.DEVELOPER],
} as const;

export type Permission = keyof typeof ROLE_PERMISSIONS;

/** Check if a role has a specific permission */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return (ROLE_PERMISSIONS[permission] as readonly UserRole[]).includes(role);
}
