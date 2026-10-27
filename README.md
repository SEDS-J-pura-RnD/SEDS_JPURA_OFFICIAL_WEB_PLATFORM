# 🌌 SEDS J'pura Official Web Platform

> **Students for the Exploration and Development of Space (SEDS)**  
> **University of Sri Jayewardenepura (USJ), Sri Lanka**  
> *Official Web Platform — Space Research, Community, and Cryptographic Operations*

---

## 📚 Documentation & Operation Manuals

- 📘 **[Non-Technical Administrator Handbook](ADMIN_NON_TECHNICAL_GUIDE.md)**: A plain-English, step-by-step guide for executive committee members and chapter leaders to manage the team page, publish articles, create events, scan attendee tickets at doors, and issue QR-verifiable certificates.
- 📙 **[Complete User & Administrator Manual](USER_MANUAL.md)**: Exhaustive technical manual detailing full system architecture, Next.js 16 App Router standards, Neon multi-schema data models, RBAC matrix, and CLI runbooks.
- 🤖 **[Claude Code Developer Guide](CLAUDE.md)**: Conventions, commands, and skills for AI pair programmers and agentic development.

---

## ✨ Key System Features

- **Public Space Portal (`/(public)`)**:
  - Interactive research divisions showcase (Rocketry, Satellite Systems, Space Biology, Astronomy).
  - Project milestone tracking, active investigator directories, and industry partners.
  - Event registration engine with real-time capacity constraints and automated canvas ticket generation.
  - Cryptographic credential verification portal with live webcam QR scanning.
- **Member Cosmic Terminal (`/dashboard`)**:
  - Academic bio, avatar uploads to Neon S3, research interests, awards, and portfolio social links.
  - Executive committee terms and research project deployments.
  - Personal credential hub with one-click high-resolution QR verification code downloads.
- **Administrator Command Center (`/admin`)**:
  - Granular Role-Based Access Control (RBAC) with 24 discrete permissions.
  - Single and bulk Excel member onboarding with automatic scrypt password hashing.
  - **Live Event Ticket Scanner & QR Verification (`/admin/events/verify`)**:
    - Real-time webcam and mobile camera QR scanner.
    - Sound effect synthesis for instant audio feedback on entrance doors.
    - Duplicate check-in prevention with previous admission timestamps.
    - Live attendance progress meter and session activity history.
  - Certificate Authority issuing tamper-proof SHA-256 cryptographic signatures locked to canonical domains.
  - Immutable security audit logs recording all state mutations.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 16.2.9 (App Router) + React 19.2.4 (Turbopack, Server Actions)
- **Database**: Neon PostgreSQL Serverless (Multi-Schema: `neon_auth` and `public`)
- **ORM**: Prisma 7.8.0 with `@prisma/adapter-neon`
- **Auth**: Neon Auth / Better Auth (`@neondatabase/auth`)
- **Storage**: Neon S3 Object Storage (`@aws-sdk/client-s3`)
- **Styling**: Tailored Cosmic Design System (Vanilla CSS tokens, glassmorphism)
- **Utilities**: SheetJS (`xlsx`) for Excel bulk processing, `jsqr` for QR decoding

---

## 🚀 Getting Started

### 1. Prerequisites & Environment
Ensure you have Node.js 20+ installed. Copy `.env.example` to `.env.local` and configure your database and authentication secrets:
```bash
cp .env.example .env.local
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Generate Prisma Client
```bash
npx prisma generate
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## 🛡️ License & Institutional Ownership
© 2026 Students for the Exploration and Development of Space, University of Sri Jayewardenepura (SEDS J'pura). All rights reserved.
