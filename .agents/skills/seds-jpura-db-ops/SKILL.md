---
name: seds-jpura-db-ops
description: Database administration, Neon multi-schema operations, Prisma 7 management, Better Auth password scrypt hashing, and CLI recovery tools for SEDS J'pura. Use when running migrations, troubleshooting schema issues, or performing CLI tasks.
---

# SEDS J'pura Database & CLI Operations Skill

## Overview
This skill covers operational patterns for the Neon PostgreSQL database, Prisma 7 multi-schema configurations, authentication scrypt hashing, object storage streaming, and maintenance scripts.

---

## 1. Neon PostgreSQL Multi-Schema Setup

The database utilizes two PostgreSQL schemas defined in [prisma/schema.prisma](file:///d:/SEDs/25_26/SEDS%20JPURA/WEBSITE/seds-jpura/prisma/schema.prisma):

```prisma
datasource db {
  provider = "postgresql"
  schemas  = ["neon_auth", "public"]
}
```

### Schema Responsibilities:
1. **`neon_auth`**:
   - Managed primarily by Neon Auth / Better Auth.
   - Contains: `user`, `session`, `account`, `verification`, `invitation`, `member`, `organization`, `project_config`, `jwks`.
2. **`public`**:
   - Contains domain models: `roles`, `permissions`, `user_roles`, `role_permissions`, `divisions`, `projects`, `project_members`, `news`, `events`, `event_registrations`, `certificates`, `sponsors`, `collaborators`, `contact_inquiries`, `audit_logs`, `member_profiles`.

> [!WARNING]
> Always prefix SQL queries with schema names when running raw queries in Neon SQL console:
> `SELECT * FROM neon_auth.user WHERE email = '...';`

---

## 2. Better Auth Scrypt Password Hashing

Better Auth uses scrypt key derivation for storing passwords in `neon_auth.account`.

To hash a password programmatically outside of an active auth context:
```typescript
import { betterAuth } from "better-auth";

const tempAuth = betterAuth({
  database: { provider: "sqlite", db: {} as any },
  emailAndPassword: { enabled: true },
});
const authCtx = await tempAuth.$context;
const hashedPassword = await authCtx.password.hash(plainTextPassword);
```

---

## 3. CLI Maintenance Utilities

### Emergency Password Reset
Reset any user's credential password directly in the database:
```bash
node reset-password.js <email> <newPassword>
```
*Script*: [reset-password.js](file:///d:/SEDs/25_26/SEDS%20JPURA/WEBSITE/seds-jpura/reset-password.js)

### Inspect System Clearance & Permissions
Dump tables of all users, active roles, user-role bindings, and role permissions:
```bash
node inspect-roles.js
```
*Script*: [inspect-roles.js](file:///d:/SEDs/25_26/SEDS%20JPURA/WEBSITE/seds-jpura/inspect-roles.js)

---

## 4. Neon S3 Media Storage & Proxying

Configured in [lib/s3.ts](file:///d:/SEDs/25_26/SEDS%20JPURA/WEBSITE/seds-jpura/lib/s3.ts):
- Uploads go to `AWS_S3_BUCKET` on `AWS_ENDPOINT_URL_S3`.
- When `AWS_S3_PUBLIC_READ=false`, URLs resolve to `/api/media/[key]`.
- The route [app/api/media/[key]/route.ts](file:///d:/SEDs/25_26/SEDS%20JPURA/WEBSITE/seds-jpura/app/api/media/[key]/route.ts) streams the object from S3 with proper `Content-Type` and caching headers, avoiding the need for a public S3 bucket.

---

## 5. Prisma Commands Checklist

```bash
# Push schema updates to Neon DB without creating migration files
npx prisma db push

# Re-generate Prisma Client after modifying schema.prisma
npx prisma generate

# Open Prisma Studio to browse data locally
npx prisma studio
```
