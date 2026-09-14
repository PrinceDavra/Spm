# Phase 10 — Placement Drives, Prep Bank, Timed Quizzes & Application Tracker

## 1. Overview & Architecture

Phase 10 introduces the complete **Placement & Career Management Module** for CampusSphere. It bridges the gap between campus recruitment, student preparation, and institutional placement cell operations. The design strictly implements zero-trust server-side validation: all eligibility criteria evaluations, question authoring permissions, answer key hiding, and timed quiz scoring are performed exclusively on the server.

### Primary Workflows

1. **Student Workflow**:
   - **Discover Opportunity**: Browse active placement drives with full-text search, departmental filters, package range, and job role facets.
   - **View Server-Evaluated Eligibility**: Receive a transparent breakdown of eligibility (CGPA threshold, active backlogs limit, allowed departments, allowed semesters, batch graduation year, and required skills) with descriptive failure reasons if ineligible.
   - **Prepare in Placement Bank**: Explore 52+ preparation questions across 14 topical categories (Quantitative Aptitude, DSA, DBMS, Operating Systems, Computer Networks, OOP, HR Interview, etc.) with correct answer keys strictly stripped before submission.
   - **Take Timed Quizzes**: Start an authoritative timed attempt with countdown timer, question palette, question review marking, autosaved answers, grace-period expiration handling, and instant server-side grading with category analytics and explanations.
   - **Apply & Track Application**: Apply to eligible drives, prevent duplicate applications, withdraw if necessary, and observe real-time visual progress across the recruitment funnel (`APPLIED` → `SHORTLISTED` → `ASSESSMENT` → `INTERVIEW` → `SELECTED` / `OFFERED` or `REJECTED` / `WITHDRAWN`).
   - **Placement Readiness Score**: Track a transparent institutional preparation metric computed deterministically from quiz performance (30%), consistency (20%), topic skill coverage (20%), academic eligibility (15%), and application activity (15%).

2. **Placement Officer Workflow**:
   - **Company Management**: Onboard and manage recruiting corporate partners with logo, industry, contact person, website, and company size.
   - **Placement Drive Authoring**: Create drives in `DRAFT` state (concealed from students), configure compensation packages, deadlines, and multi-faceted eligibility criteria.
   - **Publish & Application Window**: Transition drives to `PUBLISHED` to open applications; transition to `APPLICATION_CLOSED` when deadlines expire.
   - **Candidate Pipeline Management**: Review student applications, inspect resumes and cover notes, transition candidate statuses (`APPLIED` → `SHORTLISTED` → `ASSESSMENT` → `INTERVIEW` → `SELECTED` / `OFFERED` / `REJECTED`), and record officer remarks.
   - **Audit Trail**: Every status transition generates an immutable `ApplicationStatusHistory` record, creates an `AuditLog` entry, and dispatches a notification via `NotificationService`.
   - **Institutional Analytics**: Monitor active drives, total applications, shortlist conversion rates, average CTC package, and hiring funnels.

---

## 2. Database Models & Schema Design

The Prisma schema (`prisma/schema.prisma`) incorporates normalized models and enums with safe database-offline fallbacks in `lib/placement/demo-placements.ts`:

### Enums
- `PlacementDriveStatus`: `DRAFT`, `PUBLISHED`, `APPLICATION_CLOSED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `ARCHIVED`
- `EmploymentType`: `FULL_TIME`, `INTERNSHIP`, `INTERNSHIP_TO_FULL_TIME`, `CONTRACT`
- `ApplicationStatus`: `APPLIED`, `SHORTLISTED`, `ASSESSMENT`, `INTERVIEW`, `SELECTED`, `OFFERED`, `REJECTED`, `WITHDRAWN`
- `QuestionDifficulty`: `EASY`, `MEDIUM`, `HARD`
- `QuizStatus`: `DRAFT`, `PUBLISHED`, `ARCHIVED`
- `AttemptStatus`: `IN_PROGRESS`, `SUBMITTED`, `EXPIRED`
- `PrepCategory`: `QUANTITATIVE_APTITUDE`, `LOGICAL_REASONING`, `VERBAL_ABILITY`, `DATA_INTERPRETATION`, `TECHNICAL_MCQ`, `PROGRAMMING`, `DSA`, `DBMS`, `OPERATING_SYSTEMS`, `NETWORKS`, `OOP`, `SYSTEM_DESIGN`, `HR_INTERVIEW`, `TECHNICAL_INTERVIEW`

### Core Models
- **`PlacementCompany`**: Corporate profile (`id`, `name`, `slug`, `logoUrl`, `website`, `industry`, `description`, `location`, `companySize`, `contactPerson`, `contactEmail`, `contactPhone`).
- **`PlacementDrive`**: Recruitment drive entity (`companyId`, `title`, `slug`, `role`, `employmentType`, `location`, `packageMin`, `packageMax`, `currency`, `description`, `applicationDeadline`, `driveDate`, `status`, `minCgpa`, `maxBacklogs`, `allowedDepartments`, `allowedSemesters`, `requiredSkills`, `batchCriteria`, `bondDetails`, `selectionRounds`, `createdBy`).
- **`PlacementApplication`**: Student candidate application (`driveId`, `studentId`, `studentUserId`, `resumeUrl`, `coverNote`, `status`, `officerRemarks`, `appliedAt`, `updatedAt`). Unique constraint prevents duplicate active applications.
- **`ApplicationStatusHistory`**: Lifecycle audit trail (`applicationId`, `oldStatus`, `newStatus`, `changedBy`, `remarks`, `createdAt`).
- **`PrepQuestion`**: Placement preparation question (`category`, `question`, `options`, `correctOptionIndex`, `explanation`, `difficulty`, `topic`, `marks`, `isActive`, `createdBy`). Correct answer and explanations are omitted for student queries prior to attempt completion.
- **`Quiz`**: Timed assessment (`title`, `slug`, `category`, `durationSeconds`, `questionCount`, `totalMarks`, `passingMarks`, `status`, `createdBy`).
- **`QuizQuestion`**: Join table binding questions to quizzes.
- **`QuizAttempt`**: Student exam session (`quizId`, `studentUserId`, `status`, `score`, `percentage`, `passed`, `startedAt`, `submittedAt`, `expiresAt`).
- **`QuizAttemptAnswer`**: Individual answer response (`attemptId`, `questionId`, `selectedOptionIndex`, `isCorrect`, `marksAwarded`).

---

## 3. Server-Side Engines & Business Logic

### Eligibility Engine (`PlacementService.checkEligibility`)
Evaluates academic and institutional criteria server-side:
- **CGPA Threshold**: Ensures student's CGPA is greater than or equal to `drive.minCgpa`.
- **Backlog Constraint**: Ensures active backlogs count does not exceed `drive.maxBacklogs`.
- **Department Verification**: Validates whether the student's department is in `drive.allowedDepartments` (if specified).
- **Semester Criteria**: Validates whether the student's semester is in `drive.allowedSemesters` (if specified).
- **Batch Criteria**: Compares student graduation year with `drive.batchCriteria`.
- Returns `{ isEligible: boolean, criteria: [{ name, required, actual, passed }], failureReasons: string[] }`.

### Timed Quiz Engine (`QuizService`)
- **Strict Question Projection**: Students querying questions or starting an attempt receive options and prompt ONLY; `correctOptionIndex` and `explanation` are filtered out.
- **Server Timer & Grace Expiration**: `expiresAt` is calculated and enforced on the server. Submissions past the 30-second network grace period are automatically finalized as `EXPIRED`.
- **Server-Side Grading**: Answers are graded by looking up the actual answer keys on the server. Score, percentage, and pass/fail are calculated authoritatively.
- **Review & Explanations**: Only after an attempt status transitions to `SUBMITTED` or `EXPIRED` are detailed question explanations and correct answer keys revealed to the student.

### Placement Readiness Score Formula
A deterministic 0–100 index evaluated across 5 key pillars:
$$\text{Readiness Score} = 0.30 \times Q_{\text{score}} + 0.20 \times Q_{\text{consistency}} + 0.20 \times S_{\text{coverage}} + 0.15 \times A_{\text{eligibility}} + 0.15 \times A_{\text{activity}}$$
- **Quiz Performance ($Q_{\text{score}}$)**: Average percentage across graded quiz attempts.
- **Consistency ($Q_{\text{consistency}}$)**: Metric based on total quizzes attempted (target $\ge 5$).
- **Skill Coverage ($S_{\text{coverage}}$)**: Proportion of preparation categories attempted.
- **Academic Eligibility ($A_{\text{eligibility}}$)**: Institutional profile standing (CGPA, backlogs).
- **Application Activity ($A_{\text{activity}}$)**: Engagement with active placement drives.
- Categorized into tiers: **Elite Candidate** ($\ge 85$), **Placement Ready** ($\ge 70$), **Developing** ($\ge 50$), and **Needs Preparation** ($< 50$).

---

## 4. API Endpoints

| Method | Endpoint | Access / Roles | Description |
|---|---|---|---|
| `GET` | `/api/placements/companies` | ALL (Authenticated) | List companies with search |
| `POST` | `/api/placements/companies` | `PLACEMENT_OFFICER`, `ADMIN` | Create recruiting corporate partner |
| `GET` | `/api/placements/companies/[id]` | ALL (Authenticated) | View company profile & associated drives |
| `PATCH` | `/api/placements/companies/[id]` | `PLACEMENT_OFFICER`, `ADMIN` | Update company information |
| `GET` | `/api/placements/drives` | ALL (Drafts filtered for students) | Query drives with filters (dept, role, pkg) |
| `POST` | `/api/placements/drives` | `PLACEMENT_OFFICER`, `ADMIN` | Author new drive in `DRAFT` status |
| `GET` | `/api/placements/drives/[id]` | ALL (Students 403 on DRAFT) | Drive detail + server-side eligibility |
| `PATCH` | `/api/placements/drives/[id]` | `PLACEMENT_OFFICER`, `ADMIN` | Update drive details |
| `POST` | `/api/placements/drives/[id]/publish` | `PLACEMENT_OFFICER`, `ADMIN` | Publish drive to student portal |
| `POST` | `/api/placements/drives/[id]/close` | `PLACEMENT_OFFICER`, `ADMIN` | Close application window |
| `GET` | `/api/placements/drives/[id]/eligibility` | `STUDENT` | Dedicated server eligibility check |
| `POST` | `/api/placements/drives/[id]/apply` | `STUDENT` | Apply to drive (checks eligibility & duplicates) |
| `GET` | `/api/placements/applications` | Role-Scoped | Query student applications or officer roster |
| `GET` | `/api/placements/applications/[id]` | Owner, `PLACEMENT_OFFICER`, `ADMIN` | View application details |
| `GET` | `/api/placements/applications/[id]/history` | Owner, `PLACEMENT_OFFICER`, `ADMIN` | View status transition audit history |
| `PATCH` | `/api/placements/applications/[id]/status` | `PLACEMENT_OFFICER`, `ADMIN` | Advance applicant stage with remarks |
| `POST` | `/api/placements/applications/[id]/withdraw` | Application Owner (`STUDENT`) | Withdraw active application |
| `GET` | `/api/placements/analytics` | `PLACEMENT_OFFICER`, `ADMIN`, `STUDENT` | Institutional KPIs or student readiness |
| `GET` | `/api/preparation/categories` | ALL (Authenticated) | List preparation question categories |
| `GET` | `/api/preparation/questions` | ALL (Students get stripped view) | Browse prep questions with category filter |
| `POST` | `/api/preparation/questions` | `PLACEMENT_OFFICER`, `ADMIN` | Author new question with answer key |
| `PATCH` | `/api/preparation/questions/[id]` | `PLACEMENT_OFFICER`, `ADMIN` | Update question parameters |
| `GET` | `/api/preparation/quizzes` | ALL (Authenticated) | List assessment quizzes |
| `POST` | `/api/preparation/quizzes` | `PLACEMENT_OFFICER`, `ADMIN` | Create assessment quiz |
| `GET` | `/api/preparation/quizzes/[id]` | ALL (Authenticated) | Quiz instructions & parameters |
| `POST` | `/api/preparation/quizzes/[id]/start` | `STUDENT` | Start timed attempt session |
| `POST` | `/api/preparation/attempts/[id]/answer` | Attempt Owner (`STUDENT`) | Autosave selected answer |
| `POST` | `/api/preparation/attempts/[id]/submit` | Attempt Owner (`STUDENT`) | Submit attempt for server grading |
| `GET` | `/api/preparation/attempts/[id]` | Attempt Owner, `PLACEMENT_OFFICER` | Attempt results & explanations |
| `GET` | `/api/preparation/my-progress` | `STUDENT` | Readiness score, topic strengths & quiz stats |

---

## 5. UI Components & Pages

### Student Experience
- `/dashboard/student/placements`: Placement hub featuring readiness summary card, search/filter bar, eligibility toggle, and drive cards.
- `/dashboard/student/placements/[id]`: Drive detail view with transparent eligibility audit box, selection rounds timeline, compensation details, and application modal.
- `/dashboard/student/placements/applications`: Visual application tracker displaying stage pill badges (`APPLIED`, `SHORTLISTED`, `ASSESSMENT`, `INTERVIEW`, `OFFERED`, `REJECTED`), status history timeline, officer remarks, and withdrawal button.
- `/dashboard/student/placements/preparation`: Preparation question bank with category selector, topic search, difficulty badges, and practice mode.
- `/dashboard/student/placements/quizzes`: Quizzes catalog with duration, question count, pass marks, and previous attempt scores.
- `/dashboard/student/placements/quizzes/[id]`: Timed quiz test engine featuring live countdown timer, question palette navigation, review flag toggling, option selection, and comprehensive post-submission result review with category scores and answer explanations.

### Placement Officer Experience
- `/dashboard/placement`: Officer command center with KPI summary cards (Active Drives, Total Applications, Shortlisted, Interviews, Offers, Conversion Rate), quick actions, and drive pipeline cards.
- `/dashboard/placement/companies`: Company partner management directory with add/edit modal, search, and industry categorization.
- `/dashboard/placement/drives`: Drives management table with status pills (`DRAFT`, `PUBLISHED`, `CLOSED`), quick publish/close controls, and drive creation modal.
- `/dashboard/placement/drives/[id]`: Drive management detail view with candidate applicant table, status transition dropdown, candidate filtering, and drive settings.
- `/dashboard/placement/applications`: Unified application pipeline view across all drives with status filtering, bulk candidate actions, and remark authoring.
- `/dashboard/placement/analytics`: Institutional analytics dashboard tracking recruitment funnel stages, package distribution, branch-wise placement percentages, and top hiring partners.

---

## 6. Verification & Quality Gates

### Automated Integration & Unit Tests (`npm run test`)
- **Total Tests Passing**: 246 / 246 across 13 test suites.
- **Dedicated Phase 10 Tests**: 45 / 45 passing in `tests/integration/placement.test.ts`:
  - 10 Data constraint and validation schema tests
  - 4 Company management and RBAC tests
  - 5 Drive lifecycle and role visibility tests
  - 7 Server-side eligibility engine and edge-case tests
  - 8 Application pipeline, duplicate prevention, withdrawal, and audit history tests
  - 3 Question bank security and answer key leakage protection tests
  - 5 Timed quiz engine, answer recording, auto-submit, and server-grading tests
  - 3 Placement Readiness Score and institutional KPI tests

### Live HTTP API Verification (`scripts/verify-api.mjs`)
- **Total Live Checks Passing**: 298 / 298 with **0 failures**.
- **Phase 10 Dedicated Checks (PL1 through PL34)**:
  - `PL1`: Placement Officer authentication
  - `PL2-PL3`: Company creation and duplicate rejection (HTTP 409)
  - `PL4`: Student forbidden from company authoring (HTTP 403)
  - `PL5`: Company directory querying with search
  - `PL6-PL8`: Drive authoring in DRAFT, student discovery isolation, and direct access blocking (HTTP 403)
  - `PL9`: Placement Officer publishes drive
  - `PL10`: Student accesses published drive with embedded eligibility
  - `PL11`: Dedicated server eligibility verification endpoint
  - `PL12-PL13`: Application submission and duplicate prevention (HTTP 409)
  - `PL14`: Ineligible/closed drive application blocking
  - `PL15-PL16`: Student application listing and detail retrieval
  - `PL17`: Student forbidden from modifying official status (HTTP 403)
  - `PL18-PL19`: Placement Officer views candidate and advances status to `SHORTLISTED`
  - `PL20`: Application status transition history and audit verification
  - `PL21`: Student application withdrawal
  - `PL22-PL23`: Preparation categories and question browsing (verifying answer keys and explanations are omitted for students)
  - `PL24-PL25`: Officer question authoring and student authoring prohibition (HTTP 403)
  - `PL26-PL28`: Quiz catalog, timed attempt start, answer autosaving, and answer key shielding
  - `PL29-PL30`: Server grading, score calculation, pass/fail evaluation, and post-submission explanation reveal
  - `PL31`: Student Placement Readiness Score computation and bounding
  - `PL32-PL33`: Institutional recruitment analytics and student readiness routing
  - `PL34`: Placement Officer closes drive applications

### TypeScript & Production Build Verification
- `npm run type-check`: 0 TypeScript compiler errors.
- `npm run build`: 83 routes compiled successfully with 0 production build errors.
