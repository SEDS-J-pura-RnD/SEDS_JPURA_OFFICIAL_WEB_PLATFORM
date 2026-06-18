import { z } from "zod";

// ─────────────────────────────────────────────
// Shared Zod Validation Schemas
// ─────────────────────────────────────────────

export const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createRoleSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  permissions: z.array(z.string()).default([]),
});

export const createProjectSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().min(10),
  divisionId: z.string().cuid(),
  status: z.enum(["ACTIVE", "COMPLETED", "ON_HOLD", "PLANNING"]).default("PLANNING"),
  technologies: z.array(z.string()).default([]),
  outcomes: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isPublic: z.boolean().default(true),
});

export const createNewsSchema = z.object({
  title: z.string().min(5).max(300),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  excerpt: z.string().min(10).max(500),
  content: z.string().min(20),
  imageUrl: z.string().url().optional().or(z.literal("")),
  tags: z.array(z.string()).default([]),
  isPublished: z.boolean().default(false),
});

export const createEventSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10),
  location: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  maxCapacity: z.number().int().positive().optional(),
  isPublished: z.boolean().default(false),
});

export const eventRegistrationSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
});

export const issueCertificateSchema = z.object({
  recipientName: z.string().min(2).max(100),
  recipientEmail: z.string().email().optional(),
  type: z.string().min(2).max(100),
  description: z.string().optional(),
  issueDate: z.string().datetime().optional(),
  expiryDate: z.string().datetime().optional(),
  issuedBy: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  subject: z.string().min(5).max(200),
  message: z.string().min(20).max(5000),
});

export const createSponsorSchema = z.object({
  name: z.string().min(2).max(200),
  logoUrl: z.string().url().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  tier: z.enum(["PLATINUM", "GOLD", "SILVER", "BRONZE", "PARTNER"]).default("PARTNER"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const createDivisionSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().min(10),
  icon: z.string().optional(),
  color: z.string().optional(),
});
