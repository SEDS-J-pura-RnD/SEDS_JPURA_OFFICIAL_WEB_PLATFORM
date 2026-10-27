# Claude Code Developer Guide — SEDS J'pura Official Web Platform

@AGENTS.md

## 🚀 Project Overview
Official web platform for **SEDS J'pura** (Students for the Exploration and Development of Space, University of Sri Jayewardenepura, Sri Lanka).
- **Manuals**:
  - [USER_MANUAL.md](USER_MANUAL.md) — Comprehensive technical & operational manual.
  - [ADMIN_NON_TECHNICAL_GUIDE.md](ADMIN_NON_TECHNICAL_GUIDE.md) — Plain-English guide for non-technical committee leaders.
- **Skills**: Specialized Claude skills are available in `.claude/skills/`:
  - `seds-jpura-core`: Architecture, routing, and cosmic design system.
  - `seds-jpura-admin-rbac`: Permissions (24 total), RBAC checks, and audit logging.
  - `seds-jpura-certificates`: Cryptographic issuance, SHA-256 hash generation, and QR verification.
  - `seds-jpura-db-ops`: Neon multi-schema (`neon_auth` vs `public`), Prisma 7, and CLI recovery tools.

## 🛠️ Build & Dev Commands
```bash
npm run dev        # Launch local Next.js dev server on port 3000
npm run build      # Build production bundle
npm run lint       # Run ESLint checks
npx prisma generate # Re-generate Prisma Client
npx prisma db push # Synchronize schema changes with Neon PostgreSQL
```

## ⚙️ Key Architecture Rules
- **Next.js 16**: Dynamic request APIs (`headers()`, `cookies()`, `params`, `searchParams`) are asynchronous and MUST be awaited.
- **Database Multi-Schema**: PostgreSQL contains `neon_auth` (User/Auth) and `public` (SEDS domain models). Always use explicit schema qualifiers for raw SQL.
- **Permissions**: Every administrative server action must call `checkPermissionClearance(PERMISSIONS.<KEY>)` and emit `logAudit()`.
- **Certificates**: Hashes are 64-char SHA-256. QR codes are locked to the canonical domain (`https://jpura.sedssl.org` or `NEXT_PUBLIC_APP_URL`).
- **Event Ticket Verification**: QR payloads are normalized via `lib/ticket-parser.ts`. Ticket scanning is hosted at `/admin/events/verify` with check-in state tracking and audit logging.
