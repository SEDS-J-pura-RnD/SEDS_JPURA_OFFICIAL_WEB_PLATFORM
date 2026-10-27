# 🌌 SEDS J'pura Official Web Platform — User & Administrator Manual

> **Students for the Exploration and Development of Space (SEDS)**  
> **University of Sri Jayewardenepura (USJ), Sri Lanka**  
> *Official Web Platform — Operational Documentation & User Manual*  
> *Version:* `1.0.0` | *Target Engine:* Next.js 16 (App Router), Neon PostgreSQL, Better Auth, Neon S3

> [!TIP]
> **Are you an Executive Committee member or Chapter Leader looking for a non-technical guide?**  
> Check out the [Non-Technical Administrator Handbook](ADMIN_NON_TECHNICAL_GUIDE.md) — written in plain, jargon-free English for managing team members, publishing events, writing news, and issuing certificates!

---

## 📑 Table of Contents

1. [Executive Summary & Architecture](#1-executive-summary--architecture)
   - [Technology Stack](#technology-stack)
   - [Architecture Diagram](#architecture-diagram)
2. [Public Portal Guide (General Visitors & Students)](#2-public-portal-guide)
   - [Home & Hero Showcase](#home--hero-showcase)
   - [About SEDS J'pura](#about-seds-jpura)
   - [Divisions & Research Projects](#divisions--research-projects)
   - [Events & Public Registration](#events--public-registration)
   - [News & Media Center](#news--media-center)
   - [Team Directory & Member Profiles](#team-directory--member-profiles)
   - [Verifiable Credentials & QR Scanner](#verifiable-credentials--qr-scanner)
   - [Contact Us](#contact-us)
3. [Member Guide: Cosmic Terminal (`/dashboard`)](#3-member-guide-cosmic-terminal)
   - [Accessing the Portal & Login](#accessing-the-portal--login)
   - [Member Overview Dashboard](#member-overview-dashboard)
   - [Profile Customization & Team Showcase](#profile-customization--team-showcase)
   - [Viewing Assigned Roles & Committee Terms](#viewing-assigned-roles--committee-terms)
   - [Viewing Project Memberships](#viewing-project-memberships)
   - [Managing Your Certificates & Instant QR Download](#managing-your-certificates--instant-qr-download)
4. [Administrator Guide: Command Center (`/admin`)](#4-administrator-guide-command-center)
   - [Access Control & Permission Matrix](#access-control--permission-matrix)
   - [Command Center Overview](#command-center-overview)
   - [User Management & Excel Bulk Onboarding](#user-management--excel-bulk-onboarding)
   - [Roles & Permissions System](#roles--permissions-system)
   - [Divisions & Projects Administration](#divisions--projects-administration)
   - [News & Announcements Management](#news--announcements-management)
   - [Events, Capacity Control & QR Ticket Verification](#events--attendee-capacity-control)
   - [Certificate Authority & Bulk Issuance](#certificate-authority--bulk-issuance)
   - [Sponsors & Collaborators Directory](#sponsors--collaborators-directory)
   - [Site Settings & Home Page Metrics](#site-settings--home-page-metrics-administration)
   - [Inquiries Inbox](#inquiries-inbox)
   - [Audit Logs & Compliance Trail](#audit-logs--compliance-trail)
5. [Developer & CLI Operations Runbook](#5-developer--cli-operations-runbook)
   - [Environment Variables Checklist](#environment-variables-checklist)
   - [Neon PostgreSQL Multi-Schema Architecture](#neon-postgresql-multi-schema-architecture)
   - [Authentication & Session Engine](#authentication--session-engine)
   - [Media & Object Storage (Neon S3)](#media--object-storage-neon-s3)
   - [CLI Maintenance Scripts](#cli-maintenance-scripts)
   - [Troubleshooting & FAQs](#troubleshooting--faqs)

---

## 1. Executive Summary & Architecture

The **SEDS J'pura Official Web Platform** is an institutional web system serving the space exploration community of the University of Sri Jayewardenepura. It serves three core groups:
1. **Public Visitors & Space Enthusiasts**: Access news, events, research publications, sponsor programs, team directory, and cryptographic certificate verification.
2. **SEDS Members & Researchers**: Monitor personal research assignments, manage professional biographies, track term duties, and access earned credentials.
3. **Executive Committee & System Administrators**: Maintain role-based access control (RBAC), issue tamper-proof certificates, publish content, manage projects and divisions, and oversee audit logs.

### Technology Stack

| Layer | Component | Description |
|---|---|---|
| **Frontend & SSR** | Next.js 16.2.9 (App Router) + React 19.2.4 | Server components, Server Actions, Suspense streaming |
| **Styling** | Custom Cosmic Design System (Vanilla CSS) | Space-dark aesthetic, glassmorphism, responsive grid |
| **Database** | Neon PostgreSQL Serverless | Multi-schema architecture (`neon_auth` and `public`) |
| **ORM** | Prisma 7.8.0 with `@prisma/adapter-neon` | Multi-schema support, typed relations, migrations |
| **Authentication** | Neon Auth / Better Auth | Multi-session tokens, scrypt password hashing, secure cookies |
| **Object Storage** | Neon S3-compatible Storage (`@aws-sdk/client-s3`) | Presigned uploads and secure media proxying (`/api/media/[key]`) |
| **Data Processing** | SheetJS (`xlsx`) + `jsqr` | Client-side Excel bulk importing and webcam QR scanning |

### Architecture Diagram

```
                 ┌──────────────────────────────────────────────┐
                 │                Web Clients                   │
                 │    (Desktop, Tablet, Mobile Browsers)        │
                 └──────────────────────┬───────────────────────┘
                                        │ HTTPS
                                        ▼
                 ┌──────────────────────────────────────────────┐
                 │             Next.js 16 Edge / Node           │
                 │   ├── Middleware: Session & Route Guard      │
                 │   ├── Public App: /(public) routes           │
                 │   ├── Member App: /dashboard routes          │
                 │   ├── Admin App:  /admin routes              │
                 │   └── Server Actions: lib/actions/*.ts       │
                 └───────┬──────────────┬──────────────┬────────┘
                         │              │              │
         SQL Queries via │              │ Session Auth │ Direct S3 API /
         Prisma Neon     │              │ Handshake    │ Media Proxy
                         ▼              ▼              ▼
           ┌──────────────────────┐ ┌─────────────┐ ┌────────────────┐
           │   Neon PostgreSQL    │ │  Neon Auth  │ │  Neon S3 Store │
           │ ├── neon_auth schema │ │  Service    │ │ (Avatars, News,│
           │ └── public schema    │ │             │ │  Project Media)│
           └──────────────────────┘ └─────────────┘ └────────────────┘
```

---

## 2. Public Portal Guide

The public section is fully accessible without an account, providing full transparency on SEDS J'pura activities, publications, and scientific projects.

### Home & Hero Showcase
- **Route**: `/`
- **Features**:
  - Cosmic orbital graphic banner with call-to-actions ("Explore Projects", "Verify Certificates").
  - Live statistics display (Projects, Divisions, Executive Members, Publications).
  - Mission and Vision statements outlining space research objectives.
  - Highlights of recent breakthroughs and featured events.

### About SEDS J'pura
- **Route**: `/about`
- **Features**:
  - Comprehensive history of SEDS Sri Lanka and the J'pura Chapter.
  - Pillars of activity: **Rocketry & Propulsion**, **Astronomy & Observation**, **Space Systems**, and **Education & Outreach**.
  - Affiliation links with national and global space organizations.

### Divisions & Research Projects
- **Routes**: `/projects`, `/projects/[id]`
- **Features**:
  - Categorized under dedicated research divisions (e.g., Propulsion, Avionics, Astronomy).
  - Project status tags: `PLANNING`, `ACTIVE`, `ON_HOLD`, `COMPLETED`.
  - Rich project overview: description, technologies utilized, project milestones, team leaders, and active member list.
  - Associated corporate sponsors and research collaborators.

### Events & Public Registration
- **Routes**: `/events`, `/events/[id]`
- **Features**:
  - Upcoming and past seminars, star-gazing sessions, workshops, and competitions.
  - **Live Registration Engine**:
    - Capacity constraint checks (`maxCapacity`).
    - Duplicate email rejection prevention.
    - Automatic expiry when event `startDate` has elapsed.
    - Instant registration confirmation.

### News & Media Center
- **Routes**: `/news`, `/news/[slug]`
- **Features**:
  - Official press releases, mission updates, space science articles, and competition reports.
  - Searchable tags, publication timestamp, and author attribution.

### Team Directory & Member Profiles
- **Routes**: `/team`, `/members/[id]`
- **Features**:
  - Organized by Executive Committee and specialized boards.
  - Filtered by active committee year (`termTo >= currentYear` or continuous).
  - Sorted strictly by the administrator-assigned `displayOrder`.
  - Clicking any team member leads to their public profile:
    - Custom profile photo.
    - Academic biography and research interests.
    - Awards & honors.
    - Direct verified links (LinkedIn, GitHub, Personal Portfolio).
    - List of projects led or contributed to.

### Verifiable Credentials & QR Scanner
- **Route**: `/certificates/verify`
- **Features**:
  - Institutional cryptographic verification portal.
  - **Camera QR Scanner**: Uses `jsqr` to scan printed or digital QR codes directly via web camera.
  - **Payload Agnostic Parser**: Accepts canonical verification URLs, old URLs, localhost links, or raw 64-character SHA-256 hashes.
  - **Verification Output**:
    - Recipient name and credential title.
    - Issue date and optional expiration date.
    - Unique Certificate ID (e.g., `SEDS-2026-001`).
    - Status badge: `VALID` (Green), `REVOKED` (Red), or `EXPIRED` (Amber).
    - Tamper-proof cryptographic signature hash.

### Contact Us
- **Route**: `/contact`
- **Features**:
  - General inquiry, partnership, and media contact form.
  - Submissions are securely dispatched to the administrator inbox with client IP tracking and anti-spam validations.

---

## 3. Member Guide: Cosmic Terminal (`/dashboard`)

The **Cosmic Terminal** is the dedicated portal for authenticated SEDS J'pura members and researchers.

### Accessing the Portal & Login
1. Navigate to `/auth/login`.
2. Enter your registered email address and password.
3. Upon authentication, you will be redirected to `/dashboard`.
4. If you have been designated an Administrator or Executive Committee clearance, you will see a top notification linking directly to the Command Center (`/admin`).

### Member Overview Dashboard
- **Route**: `/dashboard`
- **Widgets**:
  - **Explorer Card**: Displays your name, email, avatar, and assigned official titles.
  - **Active Terms**: Outlines your position (e.g., *President*, *Propulsion Lead*) and term duration (e.g., `2025 - 2026`).
  - **Research Deployments**: Lists all projects you are actively enrolled in, with badges denoting your role (`LEAD` or `MEMBER`).
  - **Earned Credentials**: Displays all certificates issued to your verified email.

### Profile Customization & Team Showcase
- **Route**: `/dashboard/profile`
- **Team Showcase Privileges**:
  > [!NOTE]
  > Profile customization (Avatar photo upload, biography, social media links) is enabled for active members who have a designated role marked with **Show on Team Page**.
- **Steps to update your profile**:
  1. Click **Edit Profile** from the dashboard.
  2. **Avatar Upload**: Click the upload box or drag-and-drop a portrait photo (JPG, PNG, WebP up to 5MB). The image will be processed and securely stored in SEDS S3.
  3. **Biography**: Write a short paragraph highlighting your academic focus, department, or space exploration interests.
  4. **Interests**: Add comma-separated tags (e.g., `Astrodynamics, Orbital Mechanics, CubeSats`).
  5. **Awards & Honors**: Add any university or national accolades.
  6. **Social Handles**: Add your LinkedIn profile, GitHub URL, and personal portfolio link.
  7. Click **Save Profile Details**. Your changes instantly reflect on the public `/team` and `/members/[id]` pages.
  8. **Password Update**: You can update your account password at the bottom of the page by verifying your current password.

### Managing Your Certificates & Instant QR Download
- In the **Earned Credentials** section of the dashboard:
  - Each certificate displays your Certificate ID, Credential Type, and Issue Date.
  - Click **Download QR Verification Code** to download a high-resolution PNG QR code linked directly to your canonical verification page.
  - You can embed this QR code in your resume, CV, or LinkedIn profile.

---

## 4. Administrator Guide: Command Center (`/admin`)

The **Command Center** is the centralized administrative back-office of SEDS J'pura. Access is strictly controlled via fine-grained Role-Based Access Control (RBAC).

### Access Control & Permission Matrix

The platform incorporates **24 discrete permissions** grouped into 7 security categories:

| Category | Permission Name | Description |
|---|---|---|
| **User Management** | `VIEW_USERS` | View member directory and details |
| | `CREATE_USER` | Create single or bulk onboard members |
| | `EDIT_USER` | Modify user records and profile details |
| | `DELETE_USER` | Remove user accounts |
| | `ASSIGN_ROLE` | Assign or revoke roles, positions, and terms |
| **Role Management** | `MANAGE_ROLES` | Create, update, or deactivate roles |
| | `MANAGE_PERMISSIONS` | Toggle permissions allocated to each role |
| **News & Content** | `CREATE_NEWS` | Draft new news articles |
| | `EDIT_NEWS` | Edit existing news articles |
| | `DELETE_NEWS` | Remove news articles |
| | `PUBLISH_NEWS` | Change publish state to public |
| **Events** | `CREATE_EVENT` | Add new events and workshops |
| | `EDIT_EVENT` | Modify event schedules and capacities |
| | `DELETE_EVENT` | Delete events |
| | `MANAGE_EVENTS` | View and manage attendee registrations |
| **Projects** | `CREATE_PROJECT` | Initialize research projects |
| | `EDIT_PROJECT` | Modify project statuses and descriptions |
| | `DELETE_PROJECT` | Remove projects |
| | `ASSIGN_PROJECT_MEMBER`| Assign leads and members to projects |
| | `VIEW_ALL_PROJECTS` | Access unlisted and internal projects |
| **Certificates** | `ISSUE_CERTIFICATE` | Issue single or bulk certificates |
| | `VERIFY_CERTIFICATE` | Perform manual audits of signatures |
| | `REVOKE_CERTIFICATE` | Revoke or expire issued certificates |
| **System** | `VIEW_ADMIN_DASHBOARD`| Access the `/admin` portal |
| | `VIEW_LOGS` | Access the immutable audit log trail |
| | `MANAGE_DIVISIONS` | Add or edit research divisions |
| | `MANAGE_SPONSORS` | Manage corporate sponsors & partners |
| | `MANAGE_CONTACT` | View and respond to contact inquiries |

---

### Command Center Overview
- **Route**: `/admin`
- **Dashboard Highlights**:
  - Live counts of Users, Projects, Events, Published News, Issued Certificates, and Unread Inquiries.
  - Quick action launch buttons tailored to the administrator's permission clearance.
  - Stream of the 10 most recent audit activity events with timestamp, acting user, and affected entity.

---

### User Management & Excel Bulk Onboarding
- **Route**: `/admin/users`
- **Required Permission**: `VIEW_USERS` (plus `CREATE_USER`, `EDIT_USER`, `DELETE_USER` for mutations)

#### Adding a Single User:
1. Click **+ Add Member**.
2. Provide **Full Name** and **Email Address**.
3. (Optional) Provide an initial password (minimum 8 characters). If omitted, an account is prepared for later activation.
4. **Role Assignment**:
   - Select one or more roles (e.g., *Executive Committee Member*, *General Member*).
   - Enter **Specific Position Title** (e.g., *Vice President - Technical*, *Secretary*).
   - Enter **Term From** and **Term To** years (e.g., `2025` to `2026`).
   - Enter **Display Order** (lower numbers appear first on the `/team` page).
5. Click **Save User**.

#### Excel Bulk Onboarding:
1. Click **Bulk Import via Excel**.
2. Click **Download Template (.xlsx)** to obtain the validated format:
   - Columns: `Name`, `Email`, `Position`, `Term From`, `Term To`, `Display Order`, `Role Name`, `Initial Password`.
3. Fill in the member roster and drag-and-drop the spreadsheet.
4. The client will parse the spreadsheet in memory, validate emails, match role names, and display a validation preview.
5. Click **Import Members**. The system handles atomic user creation, password scrypt hashing, and role assignment.

#### Resetting User Passwords:
1. Locate the user in the table.
2. Click **Reset Password** (🔑).
3. Enter the new secure password (minimum 8 characters).
4. Click **Update Password**. The scrypt hash is automatically generated and updated in `neon_auth.account`.

---

### Roles & Permissions System
- **Routes**: `/admin/roles`, `/admin/permissions`
- **Required Permission**: `MANAGE_ROLES`, `MANAGE_PERMISSIONS`

#### Configuring Roles:
- **Role Name**: The identifying title of the role.
- **Show on Team Page**: Toggle ON to feature members holding this role on the public `/team` page.
- **Team Section Title**: Custom heading for the role group on the team page (e.g., *Executive Committee (2025/2026)*).
- **Active Status**: Inactive roles immediately revoke associated permissions from all assigned users without deleting records.

#### Configuring Permissions:
- Navigate to `/admin/permissions`.
- View the interactive grid of all roles across the 24 permissions.
- Click any checkbox to instantly grant or revoke that permission. Server-side validation safeguards ensure permissions update in real-time.

---

### Divisions & Projects Administration
- **Routes**: `/admin/divisions`, `/admin/projects`

#### Divisions:
- Manage the institutional branches of SEDS J'pura (e.g., *Rocketry & Propulsion*, *Satellite Systems*, *Space Biology*).
- Define division slug, description, and visual theme color.

#### Projects:
- Click **+ New Project**.
- Fill in Title, Division, Status (`PLANNING`, `ACTIVE`, `ON_HOLD`, `COMPLETED`), Image, Technologies, and Public Visibility.
- **Member Assignment**: Assign active SEDS researchers and designate whether they are a **Project Lead** or **Team Member**.
- **Sponsors & Collaborators**: Link active sponsors whose logos will appear on the project showcase.

---

### News & Announcements Management
- **Route**: `/admin/news`
- **Features**:
  - Full WYSIWYG/Markdown article composer.
  - Image cover upload with automatic S3 storage.
  - Draft vs. Published toggle. Articles remain invisible to the public until marked as published.
  - Slug generation for SEO-optimized permalinks.

---

### Events & Attendee Capacity Control
- **Routes**: `/admin/events`, `/admin/events/verify`
- **Features**:
  - Event title, description, location, banner image, start and end timestamps.
  - **Max Capacity**: Set a numerical cap on attendees, or leave blank for unlimited.
  - **Attendee Management**: View all registered attendees (Name, Email, Phone, Registration Date, Admission Status) with one-click Excel export.
  - **QR Ticket Verification & Door Check-In (`/admin/events/verify`)**:
    - Live camera viewfinder using `jsqr` with cosmic reticle and laser sweep animation.
    - Front/rear camera flipping for mobile phone verification at venue entrances.
    - Real-time attendance meter (e.g. `45 of 100 Admitted (45%)`).
    - Multi-mode support: Live Camera, Photo/Screenshot Upload, and Manual Ticket ID/Email Search.
    - Verification outcomes:
      - `VALID`: Eligible for admission with one-click or automatic check-in.
      - `ALREADY_CHECKED_IN`: Prevents duplicate admissions with timestamp alert.
      - `EVENT_MISMATCH`: Warns if the ticket belongs to a different workshop or event.
      - `INVALID`: Unrecognized ticket code.
    - Live audio chimes (Web Audio API synthesizers) and session activity log with undo capabilities.

---

### Certificate Authority & Bulk Issuance
- **Route**: `/admin/certificates`
- **Required Permission**: `ISSUE_CERTIFICATE`, `REVOKE_CERTIFICATE`

#### Cryptographic Architecture:
Every certificate issued through SEDS J'pura generates a unique **SHA-256 cryptographic signature hash**:
```
SHA-256( certId + recipientEmail + recipientName + issueTimestamp + entropy )
```
This hash is permanently linked to the verification URL:
```
https://jpura.sedssl.org/certificates/verify?hash=<64-char-hash>
```

#### Issuing a Single Certificate:
1. Click **+ Issue Certificate**.
2. Enter:
   - **Certificate ID**: e.g., `SEDS-2026-EX-001` (or leave blank to auto-generate a unique ID).
   - **Recipient Name**: e.g., `Kavinda Bandara`.
   - **Recipient Email**: e.g., `kavinda@sedsjpura.org.lk` (allows the certificate to appear in the student's personal dashboard).
   - **Credential Type**: *Membership*, *Achievement*, *Appreciation*, *Workshop Participation*, *Executive Leadership*.
   - **Description**: Summary of the achievement or term.
   - **Expiry Date**: Optional expiration timestamp.
3. Click **Issue Credential**.
4. The certificate is immediately verifiable via QR code and web search.

#### Bulk Certificate Generation via Excel:
1. Click **Bulk Issue via Excel**.
2. Click **Download Template (.xlsx)**.
   - Expected columns: `Certificate ID`, `Recipient Name`, `Recipient Email`, `Credential Type`, `Description`, `Expiry Date`.
3. Upload the completed sheet.
4. Review preview table for valid rows and errors.
5. Click **Issue All Credentials**. All certificates, cryptographic hashes, and audit records will be created in an atomic batch.

#### Certificate Revocation:
- Locate the certificate in the table.
- Select the status dropdown and switch between `VALID`, `REVOKED`, or `EXPIRED`.
- The public verification page will immediately show a warning badge if revoked.

---

### Sponsors & Collaborators Directory
- **Routes**: `/admin/sponsors`, `/admin/collaborators`
- **Features**:
  - Classify sponsors into tiers: `PLATINUM`, `GOLD`, `SILVER`, `BRONZE`, `PARTNER`.
  - Store partner logos, official website links, and partnership duration.
  - Associate sponsors with specific projects.

---

### Inquiries Inbox
- **Route**: `/admin/contact`
- **Features**:
  - Lists messages submitted through the public `/contact` form.
  - Features quick "Mark as Read / Unread" toggling.
  - Displays client IP address and submission timestamp for security auditing.

---

### Site Settings & Home Page Metrics Administration
- **Route**: `/admin/site-settings`
- **Required Permission**: `VIEW_ADMIN_DASHBOARD`
- **Features**:
  - **Live Landing Page Preview**: Real-time simulation of the public statistics grid rendered directly below the hero section on `/`.
  - **Individual Metric Control**:
    - **Active Members**: Select `⚡ Auto` (live user accounts) or `✍️ Custom Override` (e.g., `150+`).
    - **Projects Launched**: Select `⚡ Auto` (live database projects) or `✍️ Custom Override` (e.g., `12+`).
    - **Research Divisions**: Select `⚡ Auto` (live database divisions) or `✍️ Custom Override` (e.g., `5`).
    - **Events Hosted**: Select `⚡ Auto` (live published events) or `✍️ Custom Override` (e.g., `45+`).
  - **Display Suffix & Labels**: Customize symbol suffixes (e.g. `+`) and official card titles.
  - **Data Persistence & Audit Log**: Values are safely stored in `public.site_settings` under key `home_stats` and trigger `SITE_SETTINGS_UPDATED` compliance events.
  - **Command Center Quick Banner**: Current numbers and modes are prominently displayed on `/admin` with direct 1-click management access.

---

### Audit Logs & Compliance Trail
- **Route**: `/admin/audit-logs`
- **Required Permission**: `VIEW_LOGS`
- **Security Standards**:
  - Every destructive or administrative state change is recorded in `public.audit_logs`.
  - Captures: Acting User, Action Type (e.g., `USER_CREATED`, `CERTIFICATE_ISSUED`, `ROLE_ASSIGNED`), Target Entity, Previous State snapshot, New State snapshot, Client IP Address, User Agent, and Timestamp.
  - Log records are immutable and cannot be deleted or edited from the user interface.

---

## 5. Developer & CLI Operations Runbook

### Environment Variables Checklist

Ensure the following variables are defined in `.env.local` (local development) and Vercel/Hosting Environment:

```env
# Database connection
DATABASE_URL="postgresql://username:password@hostname/neondb?sslmode=require"

# Neon Auth / Better Auth
BETTER_AUTH_SECRET="32_character_hex_secret"
BETTER_AUTH_URL="https://jpura.sedssl.org"
NEON_AUTH_BASE_URL="https://your-neon-auth-instance.neonauth.c-2.ap-southeast-1.aws.neon.tech/neondb/auth"
NEXT_PUBLIC_NEON_AUTH_BASE_URL="https://your-neon-auth-instance.neonauth.c-2.ap-southeast-1.aws.neon.tech/neondb/auth"
NEON_AUTH_COOKIE_SECRET="32_character_hex_cookie_secret"

# Public domain lock for certificate QR codes
NEXT_PUBLIC_APP_URL="https://jpura.sedssl.org"
NEXT_PUBLIC_APP_NAME="SEDS J'pura"

# S3 Media Storage
AWS_ENDPOINT_URL_S3="https://your-branch-id.s3.ap-southeast-1.aws.neon.tech"
AWS_ACCESS_KEY_ID="your_s3_key"
AWS_SECRET_ACCESS_KEY="your_s3_secret"
AWS_REGION="ap-southeast-1"
AWS_S3_BUCKET="seds-jp-web-storage"
AWS_S3_PUBLIC_READ="false"
```

---

### Neon PostgreSQL Multi-Schema Architecture

The platform uses two database schemas in PostgreSQL:
1. `neon_auth`: Managed by Neon Auth / Better Auth. Houses `user`, `session`, `account`, `verification`, `invitation`, `member`, `organization`.
2. `public`: Houses the SEDS J'pura domain models: `roles`, `permissions`, `user_roles`, `role_permissions`, `divisions`, `projects`, `project_members`, `news`, `events`, `event_registrations`, `certificates`, `sponsors`, `collaborators`, `contact_inquiries`, `audit_logs`, `member_profiles`.

> [!WARNING]
> When executing manual SQL queries via the Neon SQL console or CLI, always specify the schema:
> - `SELECT * FROM neon_auth.user;`
> - `SELECT * FROM public.roles;`

---

### CLI Maintenance Scripts

The repository includes CLI utilities for disaster recovery and emergency administration:

#### 1. Inspect System Roles & User Clearance
View all registered users, roles, and assigned permissions:
```bash
node inspect-roles.js
```

#### 2. Emergency Password Reset Utility
Reset any member or administrator password directly from the command line:
```bash
node reset-password.js <email> <newPassword>
```
*Example:*
```bash
node reset-password.js admin@sedsjpura.org.lk SuperSecretPass2026!
```
*Mechanism*: The script automatically connects to Neon, locates the user, hashes the password using Better Auth's scrypt engine, and updates `neon_auth.account`.

#### 3. Database Schema Push & Client Generation
Whenever `prisma/schema.prisma` is updated:
```bash
npx prisma db push
npx prisma generate
```

---

### Troubleshooting & FAQs

#### Q1: A newly assigned Executive Member is not showing up on the `/team` page.
- **Cause 1**: The role itself may have `showOnTeam` disabled. Visit `/admin/roles` and enable "Show on Team Page".
- **Cause 2**: The user's role assignment lacks a **Position** title. The `/team` page only displays members with an explicit position (e.g. *President*, *Event Coordinator*).
- **Cause 3**: The assignment's `termTo` year is in the past. Verify that `termTo` is either empty or `>= currentYear`.

#### Q2: Uploaded images fail with S3 errors.
- Ensure `AWS_ENDPOINT_URL_S3`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY` are populated.
- When `AWS_S3_PUBLIC_READ=false`, images are streamed securely through the local media proxy `/api/media/[key]`. Ensure your Next.js domain allows image optimization if using `<Image />`.

#### Q3: QR codes generated on localhost don't work when scanned on mobile devices.
- QR code generation is locked to the canonical production URL `https://jpura.sedssl.org` (or `NEXT_PUBLIC_APP_URL`) via `lib/certificate-url.ts`. This ensures test QR codes can be safely printed on physical certificates without hardcoding `localhost`.
