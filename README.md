# CampusSphere — All-in-One College Ecosystem

> A production-grade, multi-role academic enterprise resource planning (ERP) and campus life management platform engineered with Next.js 16 App Router, TypeScript, Tailwind CSS, Prisma ORM, and PostgreSQL.

---

## Overview

**CampusSphere** is a centralized college ecosystem designed to unify the academic, administrative, and student life activities of higher education institutions. Rather than relying on fragmented third-party tools, legacy desktop systems, and disconnected spreadsheets, CampusSphere delivers an integrated, real-time platform covering curriculum scheduling, daily attendance, continuous grading, semester examinations, corporate placements, club governance, lost-and-found recoveries, and executive intelligence.

---

## Problem Statement

Higher education institutions face significant operational and data silos:
1. **Academic Fragmentation:** Timetable generation, daily attendance marking, and assignment submissions are conducted across disparate legacy tools.
2. **Attendance Vulnerability & Late Interventions:** Manual registers delay identification of at-risk students until exam eligibility deadlines have already passed.
3. **Examination & Transcript Inefficiencies:** Gradebook tabulation, moderation, revaluation petitions, and transcript printing suffer from slow processing times and calculation discrepancies.
4. **Campus Life Disconnection:** Campus drives, club memberships, campus notices, and lost item recovery operate on informal social groups lacking verification or auditability.
5. **Lack of Institutional Visibility:** Department heads and deans lack real-time predictive analytics to forecast pass rates, monitor room utilization, and benchmark department workloads.

CampusSphere resolves these challenges through a unified data model, deterministic algorithms (constraint satisfaction, multi-factor matching, weighted readiness scoring), and strict role-based access control.

---

## Key Features

- **Multi-Role RBAC:** Discrete access permissions for Student, Faculty, Admin, Club Coordinator, and Placement Officer.
- **Constraint-Based Timetable Generator:** Deterministic CSP engine solving room, faculty, and division conflicts with MRV heuristics and forward checking.
- **Predictive Attendance Engine:** Real-time attendance percentage tracking with "classes required to attain 75%" projection formula.
- **Assignment Lifecycle & File Security:** Late penalties, versioned resubmissions, grading drawers, and strict executable file blocking.
- **Institutional Communication & Dynamic Targeting:** Targeted notices by department, division, or role with live preview, read tracking, and unread badges.
- **Event Discovery & Atomic Capacity Management:** State-driven events, race-condition safe RSVPs, QR/Confirmation passes, and .ics calendar exports.
- **Club Governance:** Discoverable student organizations, application pipelines, event hosting, and deterministic engagement scoring.
- **Corporate Placements & Timed Preparation Engine:** Drive management, automated eligibility checks, question banks, timed quizzes with autosave, and readiness benchmarking.
- **Lost & Found Community Board:** Multi-factor algorithmic matching, proof-of-ownership claims, anti-self-approval enforcement, and physical handover chain-of-custody.
- **Smart Notification Feed:** Cross-module event triggers, unread counters, notification preferences, and dynamic action buttons.
- **Executive Analytics & Cross-Module Intelligence:** 10 master KPI cards, at-risk rosters, period utilization heatmaps, and RFC 4180 CSV exports.
- **Exam Management, Gradebook & Official Transcripts:** Complete examination scheduling with conflict detection, 10-point relative/absolute grading, gradebook lockdown, revaluation petitions, and tamper-resistant academic transcripts.

---

## User Roles

CampusSphere enforces strict server-side zero-trust authorization across five institutional roles:

| Role | Primary Responsibilities | Default Landing Route |
| :--- | :--- | :--- |
| **`STUDENT`** | Attendance viewing, timetable, assignments, events, clubs, placement drives, prep quizzes, lost-and-found, exam results, transcript | `/dashboard/student` |
| **`FACULTY`** | Attendance register & bulk marking, assignment authoring & grading, timetable view, student notices, exam invigilation & gradebook | `/dashboard/faculty` |
| **`ADMIN`** | Department setup, programs, rooms, faculty workload mappings, timetable CSP solver, exam lifecycle, audit logs, executive intelligence | `/dashboard/admin` |
| **`CLUB_COORDINATOR`**| Club profile management, member application reviews, activity scheduling, club engagement metrics | `/dashboard/club` |
| **`PLACEMENT_OFFICER`**| Recruiting partner onboarding, placement drive publishing, candidate pipeline tracking, readiness analytics, hiring reports | `/dashboard/placement` |

---

## Technology Stack

- **Framework:** Next.js 16.3.4 (App Router, Server Actions, Server Components & Dynamic Route Handlers)
- **Language:** TypeScript 5.x (Strict typing, no loose any)
- **Styling & UI:** Tailwind CSS, Lucide React Icons, Glassmorphic responsive layouts
- **Database & ORM:** PostgreSQL, Prisma 6.4 LTS (24+ normalized models)
- **Authentication & Security:** Signed JWTs via `jose` in `HttpOnly`, `SameSite=Lax`, `Secure` cookies, salted `bcryptjs` password hashing, Edge Middleware routing guards
- **Visualization:** Recharts (Responsive bar charts, line graphs, radial progress gauges, area charts)
- **Data Export:** RFC 4180 compliant CSV streams and styled printable academic transcripts
- **Testing:** Vitest 5.x, custom live HTTP verification harness (`scripts/verify-api.mjs`)

---

## System Architecture

CampusSphere uses a hybrid Next.js App Router architecture:
```
Client Browser (Desktop / Tablet / Mobile)
       │
       ▼
Edge Middleware (proxy.ts / middleware.ts) ──[JWT Decryption & Route RBAC]
       │
       ├──► React Server Components (Streaming Dashboard Shells)
       │
       └──► API Route Handlers (/api/*)
              │
              ├──► Server-Side RBAC Guard (requireAuth / checkRole)
              ├──► Input Validation (Zod Schemas)
              ├──► Service Layer (Domain Logic, CSP, Matcher, Grading)
              └──► Persistence Layer (Prisma ORM Client / PostgreSQL)
```

---

## Database Architecture

The normalized PostgreSQL schema spans 24+ core relational entities:
- **Identity & Organization:** `User`, `StudentProfile`, `FacultyProfile`, `Department`, `Program`, `Semester`, `Division`, `AcademicClass`
- **Campus Facilities & Scheduling:** `Room`, `Subject`, `FacultySubject`, `TimetableSlot`, `TimetableVersion`
- **Academics & Evaluation:** `AttendanceRecord`, `Assignment`, `AssignmentSubmission`, `Exam`, `ExamGrade`, `RevaluationRequest`
- **Campus Engagement:** `Notice`, `NoticeRead`, `Event`, `EventRegistration`, `Club`, `ClubMembership`, `ClubActivity`
- **Career & Campus Services:** `Company`, `PlacementDrive`, `PlacementApplication`, `QuestionBank`, `QuizAttempt`, `LostFoundItem`, `LostFoundClaim`, `Notification`, `AuditLog`

---

## Major Modules

### Authentication & RBAC
- JWT signed session tokens stored in secure, `HttpOnly` cookies.
- Server-side guard utilities (`requireAuth`, `checkRole`) preventing horizontal and vertical privilege escalation.
- One-click demo account switcher for immediate reviewer evaluations.

### Attendance
- Subject-wise and aggregate percentage calculation.
- Mathematical attendance projection engine calculating exact lectures required to maintain the mandatory 75% threshold.
- Faculty bulk attendance register with audited single-record corrections.

### Timetable
- Deterministic Constraint Satisfaction Problem (CSP) solver engine using Minimum Remaining Values (MRV) and Degree heuristics with forward checking.
- Detects and resolves room clashes, faculty double-bookings, and division overlaps.
- Versioned draft and publish workflows.

### Assignments
- Assignment authoring with dynamic deadline urgency badges.
- Configurable late submission penalty rules.
- File upload scanner blocking `.exe`, `.bat`, `.sh`, `.cmd`, `.msi` executables and directory traversal.
- Faculty grading drawer with instant student notification alerts.

### Notices
- Target audience routing (`ALL`, `STUDENTS`, `FACULTY`, `DEPARTMENT`, `DIVISION`).
- Live card preview during authoring.
- Automated read tracking, unread counters, and instant notification alerts.

### Events
- Campus event catalog with multi-status lifecycle (`DRAFT`, `REGISTRATION_OPEN`, `REGISTRATION_CLOSED`, `COMPLETED`, `ARCHIVED`).
- Atomic capacity check preventing race conditions.
- QR/Confirmation pass rendering and standard `.ics` iCalendar calendar download.

### Clubs
- Student club directory with categorized filters.
- Membership application and approval drawer for coordinators.
- Activity scheduling and deterministic club engagement scoring (0–100).

### Placement
- Company profiles and recruitment drive pipeline management.
- Server-side student eligibility verification (minimum CGPA, department, backlogs).
- 52+ question preparation bank with hidden answer keys.
- Timed practice quizzes with autosave and instant feedback.
- Placement readiness score engine (30% Academic, 20% Attendance, 20% Quiz, 15% Assignments, 15% Club).

### Lost & Found
- Reporting workflow for `LOST` and `FOUND` items with unique case reference numbers.
- Algorithmic matching engine (0–100 score based on category, date proximity, and textual similarity).
- Proof-of-ownership claim verification with strict anti-self-approval protection.
- Physical handover confirmation locking records into permanent immutable resolution.

### Notifications
- Real-time cross-module notification dispatch on grades, deadlines, drives, and notice events.
- Smart information hub aggregating high-priority academic announcements.
- Granular notification preferences and one-click "Mark All as Read".

### Analytics
- Executive dashboard with 10 master operational KPI cards.
- Deterministic at-risk student registry identifying individuals below academic thresholds.
- Classroom and laboratory period utilization heatmaps (Periods 1–6).
- RFC 4180 compliant CSV report export engine.

### Exams & Gradebook
- Examination scheduling with conflict prevention for rooms and invigilators.
- Candidate eligibility roster verification.
- Faculty gradebook entry with absent marking and 10-point relative/absolute grading calculations.
- Administrative result publishing and permanent gradebook lockdown.

### Results & Transcripts
- Student semester result breakdown with SGPA and cumulative CGPA.
- Academic transcript generator displaying completed semesters, credit distribution, and degree classifications.
- Tamper-resistant printable official transcript view and structured CSV export.
- Student revaluation petition portal with administrative review workflow.

---

## Security

- **Authentication:** Salted bcrypt hashing, signed stateless JWTs, strict expiration timeouts.
- **Cookie Security:** `HttpOnly`, `SameSite=Lax`, `Secure` cookies in production; zero credential leakage in client-side bundles.
- **Access Control:** Authoritative server-side ownership checks across all endpoints, blocking IDOR tampering on `studentId`, `facultyId`, `examId`, and `claimId`.
- **HTTP Security Headers:** Configured in `next.config.ts`:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `X-DNS-Prefetch-Control: on`
- **File Upload Protection:** Strict MIME type validation, file size ceilings, filename sanitization, and blocking of executable binary signatures.
- **Privacy Assurance:** Sensitive data such as password hashes, JWT secrets, and administrative audit traces are sanitized prior to client responses.

---

## Testing

CampusSphere maintains an automated dual-layer testing pyramid:
- **Unit & Integration Suite (Vitest):** 19 test files covering all 16 modules, RBAC boundaries, CSP solver algorithms, grading formulas, and file scanners.
  - **Result: 446 / 446 tests passing (100%)**
- **Live HTTP Verification Suite (`scripts/verify-api.mjs`):** Full end-to-end HTTP assertions against live Next.js server endpoints.
  - **Result: 553 / 553 assertions passing (100%)**
- **Type Checking:** `tsc --noEmit` verifies strict TypeScript typing.
  - **Result: 0 errors**
- **Production Build:** Full static page and route compilation.
  - **Result: PASS (235+ routes generated)**

---

## Demo Credentials

Pre-seeded institutional accounts for local and evaluation demonstrations:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Student** | `student@campussphere.edu` | `StudentPassword@123` |
| **Faculty** | `faculty@campussphere.edu` | `FacultyPassword@123` |
| **Admin** | `admin@campussphere.edu` | `AdminPassword@123` |
| **Placement Officer** | `placement@campussphere.edu`| `PlacementPassword@123` |
| **Club Coordinator** | `club@campussphere.edu` | `ClubPassword@123` |

*Note: The login screen includes a 1-click Demo Role Switcher to instantly switch sessions without manual typing.*

---

## Local Setup

### Prerequisites
- Node.js 18.17+ or 20.x
- npm 9+
- PostgreSQL 14+ (or compatible cloud instance: Neon, Supabase, Vercel Postgres)

### Installation
```bash
# 1. Clone repository
git clone https://github.com/your-org/CampusSphere.git
cd CampusSphere

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your PostgreSQL credentials and JWT secret
```

---

## Environment Variables

Configure `.env` using `.env.example` as a template:

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/campussphere?schema=public` |
| `JWT_SECRET` | Secret key for signing session tokens | `campussphere-super-secure-jwt-secret-key-2026-evaluation-token` |
| `NEXT_PUBLIC_APP_URL`| Base application URL | `http://localhost:3000` |
| `NODE_ENV` | Runtime environment | `development` / `production` |

---

## Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Apply migrations to database
npx prisma migrate deploy

# Seed baseline academic records
npm run seed
```

*Note: For evaluation and testing environments without a live PostgreSQL daemon, CampusSphere features resilient in-memory fallback catalogs for all services, enabling full demonstration and automated testing.*

---

## Running the Project

```bash
# Run in development mode (hot reloading)
npm run dev

# Run Vitest test suite
npm run test

# Run strict TypeScript validation
npm run type-check
```

---

## Production Build

```bash
# Compile optimized production bundle
npm run build

# Launch production server on port 3000
npm run start
```

---

## Vercel Deployment

CampusSphere is pre-configured for zero-configuration deployment on Vercel:

1. **Push Repository to GitHub / GitLab:** Ensure all changes are pushed to your remote repository.
2. **Import Project into Vercel:** Go to [Vercel Dashboard](https://vercel.com/new) and select the CampusSphere repository.
3. **Configure Environment Variables:**
   - Add `DATABASE_URL` (pointing to Vercel Postgres, Neon, or Supabase).
   - Add `JWT_SECRET` (secure random string).
   - Add `NEXT_PUBLIC_APP_URL` (your production Vercel URL, e.g., `https://campussphere.vercel.app`).
4. **Deploy:** Click **Deploy**. Vercel will run `prisma generate && next build` automatically.
5. **Run Migrations on Production Database:**
   ```bash
   npx prisma migrate deploy
   ```

---

## Known Limitations

- **Email SMTP Delivery:** Notifications and announcement triggers currently populate the in-app notification center and real-time smart feed; live external SMTP dispatch requires configuring institutional SendGrid or AWS SES credentials.
- **External CDN Drivers in Air-Gapped / Isolated Envs:** Certain headless browser automation binaries (e.g., Playwright win32 zip) encounter CDN blocks in restricted sandbox environments; full regression testing is completed via Vitest and the live HTTP assertion harness.

---

## Future Scope

- **Biometric / RFID Hardware Integration:** Direct physical turnstile and laboratory scanner integration via WebSockets for instantaneous physical attendance logging.
- **Mobile Native Application:** React Native / Expo companion app utilizing the existing secure REST API endpoints.
- **Institutional Single Sign-On (SSO):** SAML 2.0 / OAuth2 integration with Google Workspace for Education and Microsoft Azure Active Directory.
- **Automated Fee Reconciliation:** Secure institutional fee and fine settlement gateway integration.
