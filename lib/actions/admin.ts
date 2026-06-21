"use server";

import { prisma } from "../db";
import { auth } from "../auth";
import { headers } from "next/headers";
import { isAdmin, hasPermission, PERMISSIONS, Permission } from "../permissions";
import { logAudit, getClientIP, AuditAction } from "../audit";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

// ─────────────────────────────────────────────
// AUTH & CLEARANCE CHECK UTILITY
// ─────────────────────────────────────────────
async function checkPermissionClearance(permission: Permission) {
  const { data: session } = await auth.getSession({ fetchOptions: { headers: await headers() } });
  if (!session) throw new Error("Unauthenticated. Access denied.");
  
  const hasAccess = await hasPermission(session.user.id, permission);
  if (!hasAccess) throw new Error(`Unauthorized. Missing required permission: ${permission}`);
  
  return session;
}

async function hashPassword(password: string): Promise<string> {
  const { betterAuth } = await import("better-auth");
  const tempAuth = betterAuth({
    database: {
      provider: "sqlite",
      db: {} as any
    },
    emailAndPassword: {
      enabled: true
    }
  });
  const authCtx = await tempAuth.$context;
  return await authCtx.password.hash(password);
}

// ─────────────────────────────────────────────
// MEMBER / USER ACTIONS
// ─────────────────────────────────────────────

export async function createUserAction(data: {
  name: string;
  email: string;
  roleIds: string[];
  password?: string;
}) {
  const session = await checkPermissionClearance(PERMISSIONS.CREATE_USER);
  const ip = await getClientIP();

  // Create user
  const newUser = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      emailVerified: true, // Seeding/creating via admin trusts the email by default
    },
  });

  // Assign roles
  if (data.roleIds && data.roleIds.length > 0) {
    await prisma.userRole.createMany({
      data: data.roleIds.map((roleId) => ({
        userId: newUser.id,
        roleId,
      })),
    });
  }

  // Create credential account for Better Auth
  if (data.password) {
    const hashedPassword = await hashPassword(data.password);
    await prisma.account.create({
      data: {
        id: crypto.randomUUID(),
        userId: newUser.id,
        accountId: newUser.id,
        providerId: "credential",
        password: hashedPassword,
      },
    });
  }

  await logAudit({
    userId: session.user.id,
    action: "USER_CREATED",
    entity: "User",
    entityId: newUser.id,
    newState: { name: newUser.name, email: newUser.email, roles: data.roleIds },
    ipAddress: ip,
  });

  revalidatePath("/admin/users");
  return { success: true, userId: newUser.id };
}

export async function updateUserAction(
  targetUserId: string,
  data: {
    name: string;
    email: string;
    roleIds: string[];
  }
) {
  const session = await checkPermissionClearance(PERMISSIONS.EDIT_USER);
  const ip = await getClientIP();

  // Fetch previous state
  const prevUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: { userRoles: true },
  });
  if (!prevUser) throw new Error("Target member record not found.");

  // Update user details
  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: {
      name: data.name,
      email: data.email,
    },
  });

  // Dynamic role assignment via a transaction
  await prisma.$transaction([
    prisma.userRole.deleteMany({ where: { userId: targetUserId } }),
    prisma.userRole.createMany({
      data: data.roleIds.map((roleId) => ({
        userId: targetUserId,
        roleId,
      })),
    }),
  ]);

  await logAudit({
    userId: session.user.id,
    action: "USER_UPDATED",
    entity: "User",
    entityId: targetUserId,
    prevState: { name: prevUser.name, email: prevUser.email, roles: prevUser.userRoles.map(ur => ur.roleId) },
    newState: { name: updatedUser.name, email: updatedUser.email, roles: data.roleIds },
    ipAddress: ip,
  });

  revalidatePath("/admin/users");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteUserAction(targetUserId: string) {
  const session = await checkPermissionClearance(PERMISSIONS.DELETE_USER);
  const ip = await getClientIP();

  if (targetUserId === session.user.id) {
    throw new Error("Self-destruction override block: You cannot delete your own active administrator account.");
  }

  const prevUser = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!prevUser) throw new Error("Target user record not found.");

  await prisma.user.delete({
    where: { id: targetUserId },
  });

  await logAudit({
    userId: session.user.id,
    action: "USER_DELETED",
    entity: "User",
    entityId: targetUserId,
    prevState: { name: prevUser.name, email: prevUser.email },
    ipAddress: ip,
  });

  revalidatePath("/admin/users");
  return { success: true };
}

// ─────────────────────────────────────────────
// ROLE ACTIONS
// ─────────────────────────────────────────────

export async function createRoleAction(data: {
  name: string;
  description: string;
}) {
  const session = await checkPermissionClearance(PERMISSIONS.MANAGE_ROLES);
  const ip = await getClientIP();

  const newRole = await prisma.role.create({
    data: {
      name: data.name,
      description: data.description,
      isActive: true,
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "ROLE_CREATED",
    entity: "Role",
    entityId: newRole.id,
    newState: newRole,
    ipAddress: ip,
  });

  revalidatePath("/admin/roles");
  return { success: true, roleId: newRole.id };
}

export async function updateRoleAction(
  roleId: string,
  data: {
    name: string;
    description: string;
    isActive: boolean;
  }
) {
  const session = await checkPermissionClearance(PERMISSIONS.MANAGE_ROLES);
  const ip = await getClientIP();

  const prevRole = await prisma.role.findUnique({ where: { id: roleId } });
  if (!prevRole) throw new Error("Role record not found.");

  const updatedRole = await prisma.role.update({
    where: { id: roleId },
    data: {
      name: data.name,
      description: data.description,
      isActive: data.isActive,
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "ROLE_UPDATED",
    entity: "Role",
    entityId: roleId,
    prevState: prevRole,
    newState: updatedRole,
    ipAddress: ip,
  });

  revalidatePath("/admin/roles");
  return { success: true };
}

export async function deleteRoleAction(roleId: string) {
  const session = await checkPermissionClearance(PERMISSIONS.MANAGE_ROLES);
  const ip = await getClientIP();

  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: { userRoles: true },
  });
  if (!role) throw new Error("Role record not found.");

  if (role.userRoles.length > 0) {
    throw new Error(`Integrity block: Cannot delete role '${role.name}' because it is currently assigned to ${role.userRoles.length} active member(s).`);
  }

  if (role.name === "Admin") {
    throw new Error("System protection override block: The core 'Admin' authorization role cannot be removed.");
  }

  await prisma.role.delete({ where: { id: roleId } });

  await logAudit({
    userId: session.user.id,
    action: "ROLE_DELETED",
    entity: "Role",
    entityId: roleId,
    prevState: { name: role.name },
    ipAddress: ip,
  });

  revalidatePath("/admin/roles");
  return { success: true };
}

// ─────────────────────────────────────────────
// PERMISSION ASSIGNMENT ACTIONS
// ─────────────────────────────────────────────

export async function togglePermissionAction(
  roleId: string,
  permissionId: string,
  assign: boolean
) {
  const session = await checkPermissionClearance(PERMISSIONS.MANAGE_PERMISSIONS);
  const ip = await getClientIP();

  if (assign) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId, permissionId },
      },
      update: {},
      create: { roleId, permissionId },
    });
  } else {
    // Check if removing permission from Admin
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    const permission = await prisma.permission.findUnique({ where: { id: permissionId } });
    
    if (role?.name === "Admin" && permission?.name === PERMISSIONS.VIEW_ADMIN_DASHBOARD) {
      throw new Error("System block: Cannot revoke VIEW_ADMIN_DASHBOARD permission from the Admin role.");
    }

    await prisma.rolePermission.deleteMany({
      where: { roleId, permissionId },
    });
  }

  await logAudit({
    userId: session.user.id,
    action: "PERMISSION_UPDATED",
    entity: "RolePermission",
    entityId: `${roleId}_${permissionId}`,
    newState: { roleId, permissionId, assigned: assign },
    ipAddress: ip,
  });

  revalidatePath("/admin/permissions");
  revalidatePath("/admin/roles");
  return { success: true };
}

// ─────────────────────────────────────────────
// DIVISION ACTIONS
// ─────────────────────────────────────────────

export async function updateDivisionAction(
  divisionId: string,
  data: {
    description: string;
    icon: string;
    color: string;
  }
) {
  const session = await checkPermissionClearance(PERMISSIONS.MANAGE_DIVISIONS);
  const ip = await getClientIP();

  const prevDiv = await prisma.division.findUnique({ where: { id: divisionId } });
  if (!prevDiv) throw new Error("Division record not found.");

  const updatedDiv = await prisma.division.update({
    where: { id: divisionId },
    data,
  });

  await logAudit({
    userId: session.user.id,
    action: "ROLE_UPDATED", // We borrow ROLE_UPDATED for general settings updates
    entity: "Division",
    entityId: divisionId,
    prevState: prevDiv,
    newState: updatedDiv,
    ipAddress: ip,
  });

  revalidatePath("/admin/divisions");
  revalidatePath("/about");
  return { success: true };
}

// ─────────────────────────────────────────────
// SPONSOR ACTIONS
// ─────────────────────────────────────────────

export async function createSponsorAction(data: {
  name: string;
  logoUrl?: string;
  website?: string;
  tier: "PLATINUM" | "GOLD" | "SILVER" | "BRONZE" | "PARTNER";
  description?: string;
  isActive: boolean;
}) {
  const session = await checkPermissionClearance(PERMISSIONS.MANAGE_SPONSORS);
  const ip = await getClientIP();

  const sponsor = await prisma.sponsor.create({
    data,
  });

  await logAudit({
    userId: session.user.id,
    action: "SPONSOR_CREATED",
    entity: "Sponsor",
    entityId: sponsor.id,
    newState: sponsor,
    ipAddress: ip,
  });

  revalidatePath("/admin/sponsors");
  revalidatePath("/sponsors");
  return { success: true };
}

export async function updateSponsorAction(
  sponsorId: string,
  data: {
    name: string;
    logoUrl?: string;
    website?: string;
    tier: "PLATINUM" | "GOLD" | "SILVER" | "BRONZE" | "PARTNER";
    description?: string;
    isActive: boolean;
  }
) {
  const session = await checkPermissionClearance(PERMISSIONS.MANAGE_SPONSORS);
  const ip = await getClientIP();

  const prevSponsor = await prisma.sponsor.findUnique({ where: { id: sponsorId } });
  if (!prevSponsor) throw new Error("Sponsor record not found.");

  const updated = await prisma.sponsor.update({
    where: { id: sponsorId },
    data,
  });

  await logAudit({
    userId: session.user.id,
    action: "SPONSOR_UPDATED",
    entity: "Sponsor",
    entityId: sponsorId,
    prevState: prevSponsor,
    newState: updated,
    ipAddress: ip,
  });

  revalidatePath("/admin/sponsors");
  revalidatePath("/sponsors");
  return { success: true };
}

export async function deleteSponsorAction(sponsorId: string) {
  const session = await checkPermissionClearance(PERMISSIONS.MANAGE_SPONSORS);
  const ip = await getClientIP();

  const prevSponsor = await prisma.sponsor.findUnique({ where: { id: sponsorId } });
  if (!prevSponsor) throw new Error("Sponsor record not found.");

  await prisma.sponsor.delete({ where: { id: sponsorId } });

  await logAudit({
    userId: session.user.id,
    action: "SPONSOR_DELETED",
    entity: "Sponsor",
    entityId: sponsorId,
    prevState: prevSponsor,
    ipAddress: ip,
  });

  revalidatePath("/admin/sponsors");
  revalidatePath("/sponsors");
  return { success: true };
}

// ─────────────────────────────────────────────
// PROJECT ACTIONS
// ─────────────────────────────────────────────

export async function createProjectAction(data: {
  title: string;
  description: string;
  divisionId: string;
  status: "ACTIVE" | "COMPLETED" | "ON_HOLD" | "PLANNING";
  technologies: string[];
  outcomes?: string;
  imageUrl?: string;
  startDate?: Date;
  endDate?: Date;
  isPublic: boolean;
  sponsorIds?: string[];
  collaboratorIds?: string[];
}) {
  const session = await checkPermissionClearance(PERMISSIONS.CREATE_PROJECT);
  const ip = await getClientIP();

  const { sponsorIds, collaboratorIds, ...rest } = data;

  const project = await prisma.project.create({
    data: {
      ...rest,
      sponsors: sponsorIds && sponsorIds.length > 0 ? {
        connect: sponsorIds.map((id) => ({ id })),
      } : undefined,
      collaborators: collaboratorIds && collaboratorIds.length > 0 ? {
        connect: collaboratorIds.map((id) => ({ id })),
      } : undefined,
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "PROJECT_CREATED",
    entity: "Project",
    entityId: project.id,
    newState: project,
    ipAddress: ip,
  });

  revalidatePath("/admin/projects");
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { success: true, projectId: project.id };
}

export async function updateProjectAction(
  projectId: string,
  data: {
    title: string;
    description: string;
    divisionId: string;
    status: "ACTIVE" | "COMPLETED" | "ON_HOLD" | "PLANNING";
    technologies: string[];
    outcomes?: string;
    imageUrl?: string;
    startDate?: Date;
    endDate?: Date;
    isPublic: boolean;
    sponsorIds?: string[];
    collaboratorIds?: string[];
  }
) {
  const session = await checkPermissionClearance(PERMISSIONS.EDIT_PROJECT);
  const ip = await getClientIP();

  const prevProject = await prisma.project.findUnique({ where: { id: projectId } });
  if (!prevProject) throw new Error("Project record not found.");

  const { sponsorIds, collaboratorIds, ...rest } = data;

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: {
      ...rest,
      sponsors: {
        set: sponsorIds ? sponsorIds.map((id) => ({ id })) : [],
      },
      collaborators: {
        set: collaboratorIds ? collaboratorIds.map((id) => ({ id })) : [],
      },
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "PROJECT_UPDATED",
    entity: "Project",
    entityId: projectId,
    prevState: prevProject,
    newState: updated,
    ipAddress: ip,
  });

  revalidatePath("/admin/projects");
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteProjectAction(projectId: string) {
  const session = await checkPermissionClearance(PERMISSIONS.DELETE_PROJECT);
  const ip = await getClientIP();

  const prev = await prisma.project.findUnique({ where: { id: projectId } });
  if (!prev) throw new Error("Project record not found.");

  await prisma.project.delete({ where: { id: projectId } });

  await logAudit({
    userId: session.user.id,
    action: "PROJECT_DELETED",
    entity: "Project",
    entityId: projectId,
    prevState: prev,
    ipAddress: ip,
  });

  revalidatePath("/admin/projects");
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function assignProjectMemberAction(
  projectId: string,
  userId: string,
  projectRole: "LEAD" | "MEMBER"
) {
  const session = await checkPermissionClearance(PERMISSIONS.ASSIGN_PROJECT_MEMBER);
  const ip = await getClientIP();

  await prisma.projectMember.upsert({
    where: {
      projectId_userId: { projectId, userId },
    },
    update: { projectRole },
    create: { projectId, userId, projectRole },
  });

  await logAudit({
    userId: session.user.id,
    action: "PROJECT_MEMBER_ADDED",
    entity: "ProjectMember",
    entityId: `${projectId}_${userId}`,
    newState: { projectId, userId, role: projectRole },
    ipAddress: ip,
  });

  revalidatePath("/admin/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function removeProjectMemberAction(projectId: string, userId: string) {
  const session = await checkPermissionClearance(PERMISSIONS.ASSIGN_PROJECT_MEMBER);
  const ip = await getClientIP();

  await prisma.projectMember.delete({
    where: {
      projectId_userId: { projectId, userId },
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "PROJECT_MEMBER_REMOVED",
    entity: "ProjectMember",
    entityId: `${projectId}_${userId}`,
    ipAddress: ip,
  });

  revalidatePath("/admin/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

// ─────────────────────────────────────────────
// NEWS ACTIONS
// ─────────────────────────────────────────────

export async function createNewsAction(data: {
  title: string;
  excerpt: string;
  content: string;
  imageUrl?: string;
  tags: string[];
  isPublished: boolean;
}) {
  const session = await checkPermissionClearance(PERMISSIONS.CREATE_NEWS);
  const ip = await getClientIP();

  const slug = data.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const news = await prisma.news.create({
    data: {
      title: data.title,
      slug,
      excerpt: data.excerpt,
      content: data.content,
      imageUrl: data.imageUrl,
      tags: data.tags,
      isPublished: data.isPublished,
      authorId: session.user.id,
      publishedAt: data.isPublished ? new Date() : null,
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "NEWS_CREATED",
    entity: "News",
    entityId: news.id,
    newState: news,
    ipAddress: ip,
  });

  revalidatePath("/admin/news");
  revalidatePath("/news");
  return { success: true, newsId: news.id };
}

export async function updateNewsAction(
  newsId: string,
  data: {
    title: string;
    excerpt: string;
    content: string;
    imageUrl?: string;
    tags: string[];
    isPublished: boolean;
  }
) {
  const session = await checkPermissionClearance(PERMISSIONS.EDIT_NEWS);
  const ip = await getClientIP();

  const prevNews = await prisma.news.findUnique({ where: { id: newsId } });
  if (!prevNews) throw new Error("News record not found.");

  const slug = data.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const updated = await prisma.news.update({
    where: { id: newsId },
    data: {
      title: data.title,
      slug,
      excerpt: data.excerpt,
      content: data.content,
      imageUrl: data.imageUrl,
      tags: data.tags,
      isPublished: data.isPublished,
      publishedAt: data.isPublished ? (prevNews.publishedAt || new Date()) : null,
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "NEWS_UPDATED",
    entity: "News",
    entityId: newsId,
    prevState: prevNews,
    newState: updated,
    ipAddress: ip,
  });

  revalidatePath("/admin/news");
  revalidatePath("/news");
  revalidatePath(`/news/${slug}`);
  return { success: true };
}

export async function deleteNewsAction(newsId: string) {
  const session = await checkPermissionClearance(PERMISSIONS.DELETE_NEWS);
  const ip = await getClientIP();

  const prev = await prisma.news.findUnique({ where: { id: newsId } });
  if (!prev) throw new Error("News record not found.");

  await prisma.news.delete({ where: { id: newsId } });

  await logAudit({
    userId: session.user.id,
    action: "NEWS_DELETED",
    entity: "News",
    entityId: newsId,
    prevState: prev,
    ipAddress: ip,
  });

  revalidatePath("/admin/news");
  revalidatePath("/news");
  return { success: true };
}

// ─────────────────────────────────────────────
// EVENT ACTIONS
// ─────────────────────────────────────────────

export async function createEventAction(data: {
  title: string;
  description: string;
  location?: string;
  imageUrl?: string;
  startDate: Date;
  endDate?: Date;
  maxCapacity?: number;
  isPublished: boolean;
}) {
  const session = await checkPermissionClearance(PERMISSIONS.CREATE_EVENT);
  const ip = await getClientIP();

  const event = await prisma.event.create({
    data,
  });

  await logAudit({
    userId: session.user.id,
    action: "EVENT_CREATED",
    entity: "Event",
    entityId: event.id,
    newState: event,
    ipAddress: ip,
  });

  revalidatePath("/admin/events");
  revalidatePath("/events");
  return { success: true, eventId: event.id };
}

export async function updateEventAction(
  eventId: string,
  data: {
    title: string;
    description: string;
    location?: string;
    imageUrl?: string;
    startDate: Date;
    endDate?: Date;
    maxCapacity?: number;
    isPublished: boolean;
  }
) {
  const session = await checkPermissionClearance(PERMISSIONS.EDIT_EVENT);
  const ip = await getClientIP();

  const prevEvent = await prisma.event.findUnique({ where: { id: eventId } });
  if (!prevEvent) throw new Error("Event record not found.");

  const updated = await prisma.event.update({
    where: { id: eventId },
    data,
  });

  await logAudit({
    userId: session.user.id,
    action: "EVENT_UPDATED",
    entity: "Event",
    entityId: eventId,
    prevState: prevEvent,
    newState: updated,
    ipAddress: ip,
  });

  revalidatePath("/admin/events");
  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
  return { success: true };
}

export async function deleteEventAction(eventId: string) {
  const session = await checkPermissionClearance(PERMISSIONS.DELETE_EVENT);
  const ip = await getClientIP();

  const prev = await prisma.event.findUnique({ where: { id: eventId } });
  if (!prev) throw new Error("Event record not found.");

  await prisma.event.delete({ where: { id: eventId } });

  await logAudit({
    userId: session.user.id,
    action: "EVENT_DELETED",
    entity: "Event",
    entityId: eventId,
    prevState: prev,
    ipAddress: ip,
  });

  revalidatePath("/admin/events");
  revalidatePath("/events");
  return { success: true };
}

// ─────────────────────────────────────────────
// CERTIFICATE ACTIONS
// ─────────────────────────────────────────────

export async function issueCertificateAction(data: {
  certId: string;
  recipientName: string;
  recipientEmail?: string;
  type: string;
  description?: string;
  expiryDate?: Date;
}) {
  const session = await checkPermissionClearance(PERMISSIONS.ISSUE_CERTIFICATE);
  const ip = await getClientIP();

  const issueDate = new Date();
  
  // Create cryptographic verification hash
  const hash = crypto
    .createHash("sha256")
    .update(`${data.certId}-${data.recipientName}-${data.recipientEmail || ""}-${issueDate.toISOString()}`)
    .digest("hex");

  const certificate = await prisma.certificate.create({
    data: {
      certId: data.certId,
      recipientName: data.recipientName,
      recipientEmail: data.recipientEmail || null,
      type: data.type,
      description: data.description || null,
      issueDate,
      expiryDate: data.expiryDate || null,
      status: "VALID",
      hash,
      issuedBy: "SEDS Jpura",
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "CERTIFICATE_ISSUED",
    entity: "Certificate",
    entityId: certificate.id,
    newState: certificate,
    ipAddress: ip,
  });

  revalidatePath("/admin/certificates");
  revalidatePath("/dashboard");
  return { success: true, hash };
}

export async function revokeCertificateAction(id: string, status: "VALID" | "REVOKED" | "EXPIRED") {
  const session = await checkPermissionClearance(PERMISSIONS.REVOKE_CERTIFICATE);
  const ip = await getClientIP();

  const prev = await prisma.certificate.findUnique({ where: { id } });
  if (!prev) throw new Error("Certificate record not found.");

  const updated = await prisma.certificate.update({
    where: { id },
    data: { status },
  });

  const auditAction: AuditAction = status === "REVOKED" ? "CERTIFICATE_REVOKED" : "CERTIFICATE_VERIFIED";

  await logAudit({
    userId: session.user.id,
    action: auditAction,
    entity: "Certificate",
    entityId: id,
    prevState: prev,
    newState: updated,
    ipAddress: ip,
  });

  revalidatePath("/admin/certificates");
  revalidatePath("/dashboard");
  return { success: true };
}

// ─────────────────────────────────────────────
// CONTACT INQUIRY ACTIONS
// ─────────────────────────────────────────────

export async function toggleInquiryReadAction(inquiryId: string, isRead: boolean) {
  const session = await checkPermissionClearance(PERMISSIONS.MANAGE_CONTACT);
  const ip = await getClientIP();

  const prev = await prisma.contactInquiry.findUnique({ where: { id: inquiryId } });
  if (!prev) throw new Error("Inquiry not found.");

  const updated = await prisma.contactInquiry.update({
    where: { id: inquiryId },
    data: { isRead },
  });

  await logAudit({
    userId: session.user.id,
    action: "ROLE_ASSIGNED", // Borrow action
    entity: "ContactInquiry",
    entityId: inquiryId,
    newState: { isRead },
    ipAddress: ip,
  });

  revalidatePath("/admin/contact");
  return { success: true };
}

export async function deleteInquiryAction(inquiryId: string) {
  const session = await checkPermissionClearance(PERMISSIONS.MANAGE_CONTACT);
  
  await prisma.contactInquiry.delete({
    where: { id: inquiryId },
  });
  
  revalidatePath("/admin/contact");
  return { success: true };
}

// ─────────────────────────────────────────────
// COLLABORATOR ACTIONS
// ─────────────────────────────────────────────

export async function createCollaboratorAction(data: {
  name: string;
  logoUrl?: string;
  website?: string;
  description?: string;
}) {
  const session = await checkPermissionClearance(PERMISSIONS.MANAGE_SPONSORS);
  const ip = await getClientIP();

  const collaborator = await prisma.collaborator.create({
    data,
  });

  await logAudit({
    userId: session.user.id,
    action: "COLLABORATOR_CREATED",
    entity: "Collaborator",
    entityId: collaborator.id,
    newState: collaborator,
    ipAddress: ip,
  });

  revalidatePath("/admin/collaborators");
  revalidatePath("/projects");
  return { success: true };
}

export async function updateCollaboratorAction(
  collaboratorId: string,
  data: {
    name: string;
    logoUrl?: string;
    website?: string;
    description?: string;
  }
) {
  const session = await checkPermissionClearance(PERMISSIONS.MANAGE_SPONSORS);
  const ip = await getClientIP();

  const prev = await prisma.collaborator.findUnique({ where: { id: collaboratorId } });
  if (!prev) throw new Error("Collaborator record not found.");

  const updated = await prisma.collaborator.update({
    where: { id: collaboratorId },
    data,
  });

  await logAudit({
    userId: session.user.id,
    action: "COLLABORATOR_UPDATED",
    entity: "Collaborator",
    entityId: collaboratorId,
    prevState: prev,
    newState: updated,
    ipAddress: ip,
  });

  revalidatePath("/admin/collaborators");
  revalidatePath("/projects");
  return { success: true };
}

export async function deleteCollaboratorAction(collaboratorId: string) {
  const session = await checkPermissionClearance(PERMISSIONS.MANAGE_SPONSORS);
  const ip = await getClientIP();

  const prev = await prisma.collaborator.findUnique({ where: { id: collaboratorId } });
  if (!prev) throw new Error("Collaborator record not found.");

  await prisma.collaborator.delete({ where: { id: collaboratorId } });

  await logAudit({
    userId: session.user.id,
    action: "COLLABORATOR_DELETED",
    entity: "Collaborator",
    entityId: collaboratorId,
    prevState: prev,
    ipAddress: ip,
  });

  revalidatePath("/admin/collaborators");
  revalidatePath("/projects");
  return { success: true };
}
