---
name: seds-jpura-core
description: Comprehensive architecture guide, technology stack conventions, routing structure, and cosmic design system standards for the SEDS J'pura official web platform. Use whenever building, modifying, or refactoring routes, components, or styles in seds-jpura.
---

# SEDS J'pura Core Architecture & Development Skill

## Overview
This skill provides essential guidelines, architecture principles, and coding conventions for developing the official web platform of **SEDS J'pura** (Students for the Exploration and Development of Space - University of Sri Jayewardenepura).

---

## 1. Technology Stack & Key Dependencies

- **Framework**: Next.js 16.2.9 (App Router) + React 19.2.4
- **Language**: TypeScript 5+ (Strict mode)
- **Database**: Neon PostgreSQL Serverless with multi-schema (`neon_auth` and `public`)
- **ORM**: Prisma 7.8.0 with `@prisma/adapter-neon`
- **Authentication**: Neon Auth / Better Auth (`@neondatabase/auth`)
- **Storage**: Neon S3-compatible Object Storage (`@aws-sdk/client-s3`)
- **Data & Tools**: SheetJS (`xlsx`), `jsqr` for QR decoding, Zod 4 for validation

---

## 2. Next.js 16 Critical Rules

> [!IMPORTANT]
> Next.js 16 features breaking changes from older versions:
> - Dynamic request APIs (`headers()`, `cookies()`, `params`, `searchParams`) are **asynchronous** and MUST be awaited.
> - Example: `const session = await auth.getSession({ fetchOptions: { headers: await headers() } });`
> - Example: `export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; ... }`

---

## 3. Directory Layout & Routing Conventions

```
seds-jpura/
├── app/
│   ├── (public)/              # Public-facing pages (Home, About, Projects, Events, News, Team, Verify)
│   ├── admin/                 # Admin Command Center routes (Protected by RBAC)
│   │   ├── audit-logs/
│   │   ├── certificates/
│   │   ├── collaborators/
│   │   ├── contact/
│   │   ├── divisions/
│   │   ├── events/
│   │   │   └── verify/        # Event Ticket Scanner & QR Verification
│   │   ├── news/
│   │   ├── permissions/
│   │   ├── projects/
│   │   ├── roles/
│   │   ├── sponsors/
│   │   └── users/
│   ├── api/                   # API routes (/api/media, /api/certificates, /api/auth, /api/upload)
│   ├── auth/login/            # Authentication login portal
│   ├── dashboard/             # Member Cosmic Terminal (/dashboard, /dashboard/profile)
│   └── globals.css            # Complete Cosmic Design System styles
├── components/
│   ├── admin/                 # AdminSidebar, ImageUpload
│   ├── certificates/          # QrScannerModal
│   └── layout/                # Navbar, Footer
├── lib/
│   ├── actions/               # Server actions (admin.ts, events.ts, profile.ts)
│   ├── audit.ts               # Immutable audit logging engine
│   ├── auth.ts                # Neon Auth server client
│   ├── auth-client.ts         # Neon Auth React client
│   ├── certificate-url.ts     # Canonical QR domain resolution & hash extraction
│   ├── db.ts                  # Prisma client with Neon adapter
│   ├── permissions.ts         # 24 permissions and RBAC checking logic
│   ├── s3.ts                  # Neon S3 upload & presigned URL engine
│   ├── ticket-parser.ts       # QR and ticket payload parser
│   └── validations.ts         # Zod schemas
└── prisma/
    └── schema.prisma          # Multi-schema Prisma definition
```

---

## 4. Cosmic Design System & CSS Standards

The platform utilizes a tailored **Cosmic Dark Theme** defined in [globals.css](file:///d:/SEDs/25_26/SEDS%20JPURA/WEBSITE/seds-jpura/app/globals.css).

### Core Design Tokens
```css
--color-space: #070714;         /* Deep void background */
--color-surface: #0e0e24;       /* Card & elevated background */
--color-surface-hover: #151538; /* Interactive hover surface */
--color-border: rgba(99, 102, 241, 0.15); /* Glassmorphic cosmic border */
--color-cosmic: #6366f1;        /* Primary indigo glow */
--color-stellar: #38bdf8;       /* Secondary cyan highlight */
--color-nebula: #ec4899;        /* Accent magenta */
--color-aurora: #10b981;        /* Success emerald */
--color-solar: #f59e0b;         /* Amber warning */
--gradient-cosmic: linear-gradient(135deg, #6366f1, #38bdf8);
```

### Standard Component Classes
- Buttons: `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-danger`, `.btn-sm`
- Cards: `.card`, `.card-glass`, `.admin-stat-card`
- Badges: `.badge`, `.badge-cosmic`, `.badge-stellar`, `.badge-success`, `.badge-danger`
- Tables: `.admin-table`, `.admin-table-container`
- Form Controls: `.input`, `.select`, `.textarea`

---

## 5. Development Workflow Commands

```bash
# Run local development server
npm run dev

# Lint code
npm run lint

# Generate Prisma client
npx prisma generate

# Synchronize database schema changes
npx prisma db push

# Build for production
npm run build
```
