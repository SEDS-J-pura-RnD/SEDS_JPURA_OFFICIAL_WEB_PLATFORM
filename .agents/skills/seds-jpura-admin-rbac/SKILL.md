---
name: seds-jpura-admin-rbac
description: Role-Based Access Control (RBAC), permission verification, admin server actions, and audit logging guide for SEDS J'pura platform. Use when modifying admin routes, adding new permissions, implementing administrative server actions, or updating user roles and term structures.
---

# SEDS J'pura Admin & RBAC Skill

## Overview
This skill guides the implementation and extension of the Role-Based Access Control (RBAC) system, administrative server actions, and immutable audit logging within the SEDS J'pura platform.

---

## 1. The RBAC Architecture

The permission system is declared in [lib/permissions.ts](file:///d:/SEDs/25_26/SEDS%20JPURA/WEBSITE/seds-jpura/lib/permissions.ts).

### Permissions Roster (24 Total)
- **User Management**: `VIEW_USERS`, `CREATE_USER`, `EDIT_USER`, `DELETE_USER`, `ASSIGN_ROLE`
- **Role Management**: `CREATE_ROLE`, `EDIT_ROLE`, `DELETE_ROLE`, `MANAGE_ROLES`, `MANAGE_PERMISSIONS`
- **Content - News**: `CREATE_NEWS`, `EDIT_NEWS`, `DELETE_NEWS`, `PUBLISH_NEWS`
- **Content - Events**: `CREATE_EVENT`, `EDIT_EVENT`, `DELETE_EVENT`, `MANAGE_EVENTS`
- **Projects**: `CREATE_PROJECT`, `EDIT_PROJECT`, `DELETE_PROJECT`, `ASSIGN_PROJECT_MEMBER`, `VIEW_ALL_PROJECTS`
- **Certificates**: `ISSUE_CERTIFICATE`, `VERIFY_CERTIFICATE`, `REVOKE_CERTIFICATE`
- **System**: `VIEW_ADMIN_DASHBOARD`, `VIEW_LOGS`, `MANAGE_DIVISIONS`, `MANAGE_SPONSORS`, `MANAGE_CONTACT`

---

## 2. Server Action Clearance Pattern

Every administrative server action in [lib/actions/admin.ts](file:///d:/SEDs/25_26/SEDS%20JPURA/WEBSITE/seds-jpura/lib/actions/admin.ts) MUST follow this clearance check:

```typescript
"use server";

import { prisma } from "../db";
import { auth } from "../auth";
import { headers } from "next/headers";
import { hasPermission, PERMISSIONS, Permission } from "../permissions";
import { logAudit, getClientIP } from "../audit";
import { revalidatePath } from "next/cache";

async function checkPermissionClearance(permission: Permission) {
  const { data: session } = await auth.getSession({
    fetchOptions: { headers: await headers() },
  });
  if (!session) throw new Error("Unauthenticated. Access denied.");

  const hasAccess = await hasPermission(session.user.id, permission);
  if (!hasAccess) {
    throw new Error(`Unauthorized. Missing required permission: ${permission}`);
  }

  return session;
}
```

---

## 3. Mandatory Audit Logging Pattern

Any state mutation (create, update, delete, role assignment) MUST be logged via [lib/audit.ts](file:///d:/SEDs/25_26/SEDS%20JPURA/WEBSITE/seds-jpura/lib/audit.ts):

```typescript
const ip = await getClientIP();

await logAudit({
  userId: session.user.id,
  action: "ROLE_ASSIGNED", // Valid AuditAction type
  entity: "UserRole",
  entityId: targetUserId,
  prevState: previousAssignmentSnapshot,
  newState: newAssignmentSnapshot,
  ipAddress: ip,
});
```

---

## 4. User Role, Position & Term Assignment

The `UserRole` model links a user to a role with institutional hierarchy attributes:

```prisma
model UserRole {
  userId       String   @db.Uuid
  roleId       String
  position     String?  // Title within role, e.g. "President", "Secretary"
  termFrom     Int?     // Start year, e.g. 2025
  termTo       Int?     // End year, e.g. 2026
  displayOrder Int?     // Lower number = displayed first on /team
  assignedAt   DateTime @default(now())
}
```

### Team Page Visibility Conditions:
For a member to appear on the public `/team` page:
1. `role.isActive == true`
2. `role.showOnTeam == true`
3. `userRole.position != null`
4. `userRole.termTo == null` OR `userRole.termTo >= currentYear`
5. Ordered within the role by `userRole.displayOrder ASC` (nulls placed last).
