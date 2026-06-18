// ─────────────────────────────────────────────
// SEDS J'pura Permission System
// All permissions available in the platform
// ─────────────────────────────────────────────

export const PERMISSIONS = {
  // User Management
  CREATE_USER: "CREATE_USER",
  EDIT_USER: "EDIT_USER",
  DELETE_USER: "DELETE_USER",
  VIEW_USERS: "VIEW_USERS",
  ASSIGN_ROLE: "ASSIGN_ROLE",

  // Role Management
  CREATE_ROLE: "CREATE_ROLE",
  EDIT_ROLE: "EDIT_ROLE",
  DELETE_ROLE: "DELETE_ROLE",
  MANAGE_ROLES: "MANAGE_ROLES",
  MANAGE_PERMISSIONS: "MANAGE_PERMISSIONS",

  // Content - News
  CREATE_NEWS: "CREATE_NEWS",
  EDIT_NEWS: "EDIT_NEWS",
  DELETE_NEWS: "DELETE_NEWS",
  PUBLISH_NEWS: "PUBLISH_NEWS",

  // Content - Events
  MANAGE_EVENTS: "MANAGE_EVENTS",
  CREATE_EVENT: "CREATE_EVENT",
  EDIT_EVENT: "EDIT_EVENT",
  DELETE_EVENT: "DELETE_EVENT",

  // Projects
  CREATE_PROJECT: "CREATE_PROJECT",
  EDIT_PROJECT: "EDIT_PROJECT",
  DELETE_PROJECT: "DELETE_PROJECT",
  ASSIGN_PROJECT_MEMBER: "ASSIGN_PROJECT_MEMBER",
  VIEW_ALL_PROJECTS: "VIEW_ALL_PROJECTS",

  // Certificates
  ISSUE_CERTIFICATE: "ISSUE_CERTIFICATE",
  VERIFY_CERTIFICATE: "VERIFY_CERTIFICATE",
  REVOKE_CERTIFICATE: "REVOKE_CERTIFICATE",

  // Sponsors
  MANAGE_SPONSORS: "MANAGE_SPONSORS",

  // System
  VIEW_LOGS: "VIEW_LOGS",
  VIEW_ADMIN_DASHBOARD: "VIEW_ADMIN_DASHBOARD",
  MANAGE_DIVISIONS: "MANAGE_DIVISIONS",
  MANAGE_CONTACT: "MANAGE_CONTACT",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_CATEGORIES = {
  "User Management": [
    PERMISSIONS.CREATE_USER,
    PERMISSIONS.EDIT_USER,
    PERMISSIONS.DELETE_USER,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.ASSIGN_ROLE,
  ],
  "Role Management": [
    PERMISSIONS.CREATE_ROLE,
    PERMISSIONS.EDIT_ROLE,
    PERMISSIONS.DELETE_ROLE,
    PERMISSIONS.MANAGE_ROLES,
    PERMISSIONS.MANAGE_PERMISSIONS,
  ],
  "News & Content": [
    PERMISSIONS.CREATE_NEWS,
    PERMISSIONS.EDIT_NEWS,
    PERMISSIONS.DELETE_NEWS,
    PERMISSIONS.PUBLISH_NEWS,
  ],
  Events: [
    PERMISSIONS.CREATE_EVENT,
    PERMISSIONS.EDIT_EVENT,
    PERMISSIONS.DELETE_EVENT,
    PERMISSIONS.MANAGE_EVENTS,
  ],
  Projects: [
    PERMISSIONS.CREATE_PROJECT,
    PERMISSIONS.EDIT_PROJECT,
    PERMISSIONS.DELETE_PROJECT,
    PERMISSIONS.ASSIGN_PROJECT_MEMBER,
    PERMISSIONS.VIEW_ALL_PROJECTS,
  ],
  Certificates: [
    PERMISSIONS.ISSUE_CERTIFICATE,
    PERMISSIONS.VERIFY_CERTIFICATE,
    PERMISSIONS.REVOKE_CERTIFICATE,
  ],
  System: [
    PERMISSIONS.VIEW_LOGS,
    PERMISSIONS.VIEW_ADMIN_DASHBOARD,
    PERMISSIONS.MANAGE_DIVISIONS,
    PERMISSIONS.MANAGE_SPONSORS,
    PERMISSIONS.MANAGE_CONTACT,
  ],
};

// ─────────────────────────────────────────────
// Server-side permission check utility
// Usage: await hasPermission(userId, PERMISSIONS.CREATE_USER)
// ─────────────────────────────────────────────

import { prisma } from "./db";

export async function getUserPermissions(userId: string): Promise<string[]> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  const permissions = new Set<string>();
  for (const ur of userRoles) {
    if (!ur.role.isActive) continue;
    for (const rp of ur.role.rolePermissions) {
      permissions.add(rp.permission.name);
    }
  }
  return Array.from(permissions);
}

export async function hasPermission(
  userId: string,
  permission: Permission
): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissions.includes(permission);
}

export async function hasAnyPermission(
  userId: string,
  permissions: Permission[]
): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId);
  return permissions.some((p) => userPermissions.includes(p));
}

export async function isAdmin(userId: string): Promise<boolean> {
  return hasPermission(userId, PERMISSIONS.VIEW_ADMIN_DASHBOARD);
}
