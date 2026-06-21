import { prisma } from "./db";
import { headers } from "next/headers";

// ─────────────────────────────────────────────
// SEDS J'pura Audit Logger
// Logs all critical actions for compliance
// ─────────────────────────────────────────────

export type AuditAction =
  | "USER_CREATED"
  | "USER_UPDATED"
  | "USER_DELETED"
  | "USER_LOGIN"
  | "USER_LOGIN_FAILED"
  | "USER_LOGOUT"
  | "ROLE_CREATED"
  | "ROLE_UPDATED"
  | "ROLE_DELETED"
  | "ROLE_ASSIGNED"
  | "ROLE_REMOVED"
  | "PERMISSION_UPDATED"
  | "PROJECT_CREATED"
  | "PROJECT_UPDATED"
  | "PROJECT_DELETED"
  | "PROJECT_MEMBER_ADDED"
  | "PROJECT_MEMBER_REMOVED"
  | "NEWS_CREATED"
  | "NEWS_UPDATED"
  | "NEWS_DELETED"
  | "NEWS_PUBLISHED"
  | "EVENT_CREATED"
  | "EVENT_UPDATED"
  | "EVENT_DELETED"
  | "CERTIFICATE_ISSUED"
  | "CERTIFICATE_REVOKED"
  | "CERTIFICATE_VERIFIED"
  | "SPONSOR_CREATED"
  | "SPONSOR_UPDATED"
  | "SPONSOR_DELETED"
  | "COLLABORATOR_CREATED"
  | "COLLABORATOR_UPDATED"
  | "COLLABORATOR_DELETED"
  | "CONTACT_RECEIVED"
  | "EVENT_REGISTRATION_CREATED";

export async function logAudit({
  userId,
  action,
  entity,
  entityId,
  prevState,
  newState,
  ipAddress,
  userAgent,
}: {
  userId?: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  prevState?: any;
  newState?: any;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        prevState,
        newState,
        ipAddress,
        userAgent,
      },
    });
  } catch (err) {
    // Never fail the main operation because of audit log failure
    console.error("[Audit] Failed to log action:", action, err);
  }
}

export async function getClientIP(): Promise<string | undefined> {
  try {
    const headersList = await headers();
    return (
      headersList.get("x-forwarded-for")?.split(",")[0] ||
      headersList.get("x-real-ip") ||
      undefined
    );
  } catch {
    return undefined;
  }
}
