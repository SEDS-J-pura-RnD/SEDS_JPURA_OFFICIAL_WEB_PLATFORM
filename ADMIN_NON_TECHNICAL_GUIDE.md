# 🚀 SEDS J'pura — Non-Technical Administrator Handbook
### *A Plain-English Guide for Executive Committee Members & Chapter Leaders*

Welcome to the **SEDS J'pura Administration Portal**! You do **not** need any coding knowledge, technical skills, or computer science background to run the website. Everything you need is accessible through point-and-click buttons on your web browser.

This handbook covers all daily tasks: publishing news, creating events, adding team members, issuing certificates with QR codes, and reading inquiries.

---

## 📌 Table of Contents

1. [How to Log In & Access the Admin Panel](#1-how-to-log-in--access-the-admin-panel)
2. [Managing the Team & Executive Committee (The `/team` Page)](#2-managing-the-team--executive-committee)
   - *The 3 Golden Rules to Make a Member Appear on the Team Page*
   - *How to Add a New Member*
   - *How to Change Someone's Role or Position*
   - *Bulk Importing Members with Excel*
3. [Publishing News & Announcements](#3-publishing-news--announcements)
4. [Creating Events, Attendee Lists & Ticket QR Scanning](#4-creating-events--managing-registrations)
   - *Step 1: Creating an Event*
   - *Step 2: Seeing Who Registered*
   - *Step 3: Scanning Tickets at the Door on Event Day (QR Scanner)*
5. [Issuing Official Certificates & QR Codes](#5-issuing-official-certificates--qr-codes)
   - *Issuing a Single Certificate*
   - *Issuing in Bulk for Competitions/Workshops (Excel)*
   - *How to Give the QR Code to the Recipient*
6. [Managing Projects & Research Divisions](#6-managing-projects--research-divisions)
7. [Adding Sponsors & Partner Organizations](#7-adding-sponsors--partner-organizations)
8. [Reading Inquiries from the Contact Page](#8-reading-inquiries-from-the-contact-page)
9. [Controlling Home Page Metrics ("Active Members", "Projects Launched", etc.)](#9-controlling-home-page-metrics)
10. [Common "Why isn't it working?" Questions & Quick Fixes](#10-troubleshooting--quick-fixes)

---

## 1. How to Log In & Access the Admin Panel

1. Open your browser and go to:  
   👉 **`https://jpura.sedssl.org/auth/login`** *(or your website link)*
2. Enter your SEDS email address and password, then click **Sign In**.
3. You will arrive at your personal **Cosmic Terminal** (`/dashboard`).
4. At the top of your screen or sidebar, click **"🌌 Admin Portal"** or **"Command Center"**. You will be taken to:  
   👉 **`/admin`**
5. On the left side of your screen, you will see the navigation menu:
   - **🏠 Dashboard**: Overview statistics and recent actions.
   - **👥 Users**: Manage chapter members, committee members, and passwords.
   - **🎭 Roles**: Manage official titles and team visibility.
   - **🔬 Projects**: Space research initiatives and team leads.
   - **📰 News**: Blog posts and press announcements.
   - **📅 Events**: Workshops, stargazing nights, and webinars.
   - **🎟️ Ticket Scanner**: Live camera QR scanner for admitting attendees at events.
   - **🏆 Certificates**: Issue verifiable digital certificates.
   - **📊 Home Page Stats**: Change the 4 numbers displayed publicly on the landing page.
   - **🤝 Sponsors**: Partner companies and institutions.
   - **✉️ Inquiries**: Messages sent from the website contact form.

---

## 2. Managing the Team & Executive Committee

When a new executive term starts (e.g., 2025/2026), you need to update who appears on the public **"Our Team"** page (`https://jpura.sedssl.org/team`).

### 🌟 The 3 Golden Rules: How a Member Appears on the Team Page
If someone is not showing up on the public `/team` page, check these 3 simple settings:

1. **Rule 1 — The Role must have "Show on Team" turned ON**:  
   Under **Roles**, make sure their role (e.g., *"Executive Committee Member"*) has the **"Show on Team Page"** box checked.
2. **Rule 2 — The Member MUST have a specific Position title**:  
   A member cannot appear as just a generic role. You must give them a title like *"President"*, *"Secretary"*, or *"Media Lead"*.
3. **Rule 3 — The Term Year must be current**:  
   If their term is set to end in `2024` and the current year is `2025` or `2026`, the system automatically moves them to past archives. Leave **"Term To"** blank for active members or set it to the current/next year.

---

### Step-by-Step: Adding a New Executive Member

1. Go to **Users** (`/admin/users`) and click the blue **"+ Add Member"** button.
2. Fill in:
   - **Name**: e.g. `Anuki Perera`
   - **Email**: e.g. `anuki@sedsjpura.org.lk`
   - **Initial Password**: Set an 8+ character password (e.g. `Seds2026Launch!`). The member can change this later.
3. In the **Role Assignment** section:
   - **Role**: Select `Executive Committee Member` (or `Board Member`).
   - **Position Title**: Enter their official post (e.g., `Vice President - Technical`).
   - **Term From**: `2025` (the year they started).
   - **Term To**: `2026` (or leave blank if ongoing).
   - **Display Order**: Numbers control who shows up first on the page:
     - `1` = President
     - `2` = Vice President
     - `3` = Secretary
     - `4` = Treasurer
     - *(Higher numbers appear below lower numbers)*.
4. Click **Save User**.
5. Once saved, tell the member to log into `/dashboard/profile` to upload their own portrait photo and bio!

---

### How to Change Someone's Post or Remove a Member
- **To edit**: Find their name under **Users**, click **Edit** (✏️), update their position or order, and click Save.
- **To reset a forgotten password**: Click the key icon (🔑) next to their name, type a new password, and click **Update Password**.
- **When their term finishes**: Edit their role and set **Term To** to the past year (e.g. `2025`). They will gracefully disappear from the active team list without deleting their account.

---

### Adding Multiple Members at Once with Excel
If you have 15+ new committee members to add:
1. Go to **Users** and click **"Bulk Import via Excel"**.
2. Click **"Download Template (.xlsx)"**.
3. Open the spreadsheet in Microsoft Excel or Google Sheets.
4. Fill in one row per person:
   | Name | Email | Position | Term From | Term To | Display Order | Role Name | Initial Password |
   |---|---|---|---|---|---|---|---|
   | John Silva | john@sedsjpura.org.lk | President | 2025 | 2026 | 1 | Executive Committee Member | SedsPass2026! |
5. Save the Excel file and drag-and-drop it into the upload box on the website.
6. Click **Import Members**. All accounts and roles will be created in seconds.

---

## 3. Publishing News & Announcements

Use the **News** section (`/admin/news`) to share competition wins, rover launch updates, or general space articles.

1. Go to **News** and click **"+ Write News"**.
2. **Title**: Catchy headline (e.g., *"SEDS J'pura Wins 1st Place at National Rover Challenge"*).
3. **Excerpt**: A 1-2 sentence preview that appears on social media cards.
4. **Cover Image**: Click the image box to upload a high-quality photo (JPG, PNG, WebP).
5. **Content**: Type your article. You can use standard formatting (bullet points, bold text, headings).
6. **Tags**: Add tags like `Rover, Robotics, Competition, Research` (separate with commas).
7. **Status**:
   - Check **"Publish Immediately"** to make it visible on the website right away.
   - Leave unchecked if it is a draft you want to finish later.
8. Click **Save Article**.

---

## 4. Creating Events & Managing Registrations

Use **Events** (`/admin/events`) for workshops, observation nights, and conferences.

### Step 1: Create the Event
1. Click **"+ Create Event"**.
2. Enter the **Title**, **Description**, and **Location** (e.g., *"Science Faculty Auditorium"* or *"Zoom Webinar"*).
3. **Start Date & Time**: When the event begins.
4. **End Date & Time**: When it finishes.
5. **Maximum Capacity** *(Important)*:
   - If physical hall seats are limited to 100 people, enter `100`. The website will automatically close registrations when the 100th person signs up!
   - If online or unlimited, leave it empty.
6. Check **"Publish Event"** so it appears on the public `/events` page.
7. Click **Save Event**.

### Step 2: See Who Registered
1. In the **Events** list, click on the **"👥 Registrations"** button next to any event.
2. You will see a complete list of all registered participants (Name, Email, Phone number, and Registration Time).
3. The list shows who has already been admitted (`🟢 Admitted`) or not yet arrived (`Not Admitted`).
4. You can also click **"📥 Export to Excel"** to download the roster with attendance times.

### Step 3: Scanning Tickets at the Door on Event Day 🎟️
When participants arrive at your event venue or workshop entrance:
1. Open your phone, tablet, or laptop and go to:  
   👉 **`/admin/events/verify`** *(or click **"Ticket Scanner"** in the sidebar)*.
2. Select your event in the **"Active Event Filter"** dropdown at the top (e.g., *"National Space Rover Challenge"*).
3. The screen will show your real-time attendance bar: e.g. **"45 of 100 Admitted (45%)"**.
4. Hold the attendee's ticket in front of the camera:
   - ✅ **Green Flash & Chime**: The ticket is **VALID**! If "Auto-Admit" is ON, the system automatically checks them in and records their arrival timestamp.
   - ⚠️ **Amber Warning**: **ALREADY CHECKED IN**! The system alerts you that this ticket was already scanned earlier (preventing people from sharing ticket screenshots).
   - 🚫 **Red Warning**: **EVENT MISMATCH**! The ticket is valid, but the attendee showed up to the wrong workshop.
5. If someone forgot their ticket or their phone died, switch to the **"⌨️ Search / Manual"** tab and type their name or email to check them in manually!

---

## 5. Issuing Official Certificates & QR Codes

Every certificate issued through SEDS J'pura is mathematically protected against tampering. When an employer or university scans the QR code, they see an official verification screen confirming SEDS J'pura issued it.

### Issuing a Single Certificate (e.g. for a Speaker or Lead)
1. Go to **Certificates** (`/admin/certificates`).
2. Click **"+ Issue Certificate"**.
3. Fill in:
   - **Certificate ID**: e.g., `SEDS-2026-WS-001` *(or leave blank to auto-generate)*.
   - **Recipient Name**: The person's full name as it should appear on the certificate.
   - **Recipient Email**: *(Recommended)* Their email address. If they have a SEDS account, it will automatically show in their member dashboard.
   - **Credential Type**: Select from the dropdown:
     - `Membership`
     - `Achievement`
     - `Workshop Participation`
     - `Appreciation`
     - `Executive Leadership`
   - **Description**: e.g., *"Successfully completed the 3-day Rocketry & Aerodynamics Bootcamp."*
   - **Expiry Date**: Leave blank for lifetime credentials.
4. Click **Issue Credential**.

---

### Issuing 50+ Certificates at Once (for Workshops or Competitions)
Instead of typing names one by one:
1. Click **"Bulk Issue via Excel"**.
2. Click **"Download Template (.xlsx)"**.
3. Open the spreadsheet and paste in the participants' names, emails, and certificate types.
4. Upload the spreadsheet back to the website.
5. Click **"Issue All Credentials"**. The system creates all certificates and generates unique verification links for each person at once.

---

### How to Get the QR Code to Put on a Printed or Digital Certificate
1. Locate the certificate in the table under `/admin/certificates`.
2. Click **"View QR"** or the QR code icon.
3. A popup will display the official QR code.
4. Click **"Download QR Code (PNG)"**.
5. Give this PNG image to your graphic designer to place on the bottom corner of the Canva / Photoshop certificate design!
6. Anyone scanning that QR code with their phone camera will be taken directly to the official verification page.

---

## 6. Managing Projects & Research Divisions

Use **Divisions** (`/admin/divisions`) and **Projects** (`/admin/projects`) to showcase your chapter's technical work.

### Adding a Research Project
1. Go to **Projects** and click **"+ New Project"**.
2. Select which **Division** it belongs to (e.g., *Propulsion Division*).
3. Enter Project **Title** and a clear **Description**.
4. **Status**:
   - `PLANNING` = Currently being researched
   - `ACTIVE` = Ongoing development
   - `ON_HOLD` = Paused
   - `COMPLETED` = Successfully flown or published
5. **Technologies Used**: e.g. `Solid Fuel Motors, Arduino, Carbon Fiber`.
6. **Project Lead & Members**: Select active members working on this project so their names show on the project page.
7. Click **Save Project**.

---

## 7. Adding Sponsors & Partner Organizations

SEDS J'pura relies on university grants, corporate sponsors, and aerospace partners.

1. Go to **Sponsors** (`/admin/sponsors`) or **Collaborators** (`/admin/collaborators`).
2. Click **"+ Add Sponsor"**.
3. Enter the company/organization **Name** and their **Website URL**.
4. Upload their **Company Logo**.
5. Select their **Tier**: `PLATINUM`, `GOLD`, `SILVER`, `BRONZE`, or `PARTNER`.
6. Save. Their logo will appear in the sponsor footer and on linked projects!

---

## 8. Reading Inquiries from the Contact Page

When visitors submit messages through the public `/contact` page:
1. Go to **Inquiries** (`/admin/contact`).
2. You will see a list of unread messages with the sender's name, email, subject, and date.
3. Click a message to read the full text.
4. You can reply directly to the sender using your SEDS email address.
5. Click **"Mark as Read"** so other committee members know it has been attended to.

---

## 9. Controlling Home Page Metrics

When visitors land on the SEDS J'pura Home Page (`/`), four highlighted statistics appear directly below the main space animation:
1. **Active Members** (e.g. `150+`)
2. **Projects Launched** (e.g. `12+`)
3. **Research Divisions** (e.g. `5`)
4. **Events Hosted** (e.g. `45+`)

You have full control over whether each number automatically counts from the database or displays a custom milestone number.

### How to Change the Home Page Numbers:
1. In the Admin Sidebar, click **"📊 Home Page Stats"** (or click **"⚙️ Manage Metrics →"** on the Command Center overview).
2. You will see a **Live Home Page Banner Preview** showing exactly what visitors currently see.
3. For each of the 4 metrics, you can choose between two modes:
   - **⚡ Auto (Live Count)**: The website calculates the exact number of active accounts, published events, projects, or divisions currently stored in the database.
   - **✍️ Custom Override**: Allows you to enter any number you choose (e.g., if you have 150 official chapter members but they haven't all registered web accounts yet).
4. You can also customize the **Display Suffix** (e.g., `+`, or leave it blank) and the **Card Title / Label**.
5. When finished, click **"💾 Save Changes"** at the top or bottom of the screen. The changes will update immediately on the public website!

---

## 10. Troubleshooting & Quick Fixes

### ❓ "Why is an Executive Committee member not appearing on the `/team` page?"
Check these three things in order:
1. Did you assign them a **Position Title** (e.g., *"Treasurer"* or *"Event Coordinator"*)? If the position box is empty, the website hides them.
2. Go to **Roles** (`/admin/roles`) and click Edit on their role. Is the box **"Show on Team Page"** checked?
3. Is their **Term To** year set to an old year (e.g., `2024`)? If so, change it to the current year or delete the number so it's active.

### ❓ "A photo upload says 'File is too large'."
- Photos should ideally be under **5 Megabytes (MB)**.
- If a mobile phone photo is 12MB, resize it or crop it using your phone's photo editor or a free website like [tinypng.com](https://tinypng.com) before uploading.

### ❓ "An event attendee says they cannot register."
- Check the event in `/admin/events`.
- If the event date has already passed, registration automatically closes.
- If the event reached its **Maximum Capacity**, the button automatically disables to prevent overbooking. You can increase the maximum capacity number if you have extra space.
- A person cannot register twice with the same email address.

### ❓ "Can I break the website by clicking something wrong?"
- **No.** The system has built-in safety protections.
- You cannot delete anything accidentally without a confirmation prompt.
- Every important action (creating users, issuing certificates, changing roles) is recorded in the **Audit Log** (`/admin/audit-logs`), meaning changes can always be traced and corrected.

---

### 📞 Need Technical Support?
If you encounter a database warning or server error, contact the SEDS J'pura Web Master or Developer Team with a screenshot of the error message.
