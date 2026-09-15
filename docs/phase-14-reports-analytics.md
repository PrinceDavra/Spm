# Phase 14 — Reports, Analytics & Admin Intelligence

## Executive Summary
Phase 14 transforms CampusSphere from a collection of discrete operational modules into a unified, data-driven academic intelligence platform. By integrating authoritative calculations and records from Phases 1 through 13, Phase 14 provides role-tailored dashboards, deterministic at-risk student detection, classroom & lab utilization tracking, faculty workload capacity audits, cross-departmental benchmarking, and RFC 4180 CSV export functionality with strict zero-trust security and IDOR protection.

---

## Architecture Overview

```
                          ┌────────────────────────┐
                          │   Client Dashboards    │
                          │ Admin / Student / Fac  │
                          └───────────┬────────────┘
                                      │
                                      ▼
                          ┌────────────────────────┐
                          │ Analytics API Gateway  │
                          │ /api/analytics/*       │
                          └───────────┬────────────┘
                                      │ (RBAC / Auth / Validation)
                                      ▼
                          ┌────────────────────────┐
                          │    AnalyticsService    │
                          │ (Central Intelligence) │
                          └───────────┬────────────┘
                                      │
          ┌──────────────┬────────────┼────────────┬──────────────┐
          ▼              ▼            ▼            ▼              ▼
    AttendanceService  AcademicService  Assignment  Placement     Club & Events
    (Phase 4 Rules)    (Phase 12 Audits)(Phase 6)   (Phase 10)    (Phases 8 & 9)
```

The analytics architecture consists of four distinct layers:
1. **Validation & Filter Layer (`validators/analytics.schema.ts`)**: Validates query parameters (`departmentId`, `programId`, `batchId`, `semester`, `divisionId`, `subjectId`, `facultyId`, `dateRange`, `startDate`, `endDate`) and export specifications.
2. **Authoritative Intelligence Engine (`services/analytics.service.ts`)**: Server-side calculation methods that query authoritative data stores without creating redundant or competing formulas.
3. **API & Security Layer (`app/api/analytics/*`)**: 16 REST endpoints that enforce session authentication, role-based authorization, and data-scope isolation.
4. **Presentation & Visualization Layer (`components/analytics/*`)**: Role-specific dashboard views using Recharts for trend analysis, distribution breakdowns, and workload allocations.

---

## Authoritative Metrics & Calculations

| Metric / Domain | Source Module | Authoritative Formula / Integration Rule |
| :--- | :--- | :--- |
| **Attendance Health** | Phase 4 (`AttendanceService`) | $\frac{\text{Present} + \text{Excused}}{\text{Conducted}} \times 100$. Status classification: **SAFE** ($\ge 75\%$), **WARNING** ($65\% - 74.99\%$), **CRITICAL** ($< 65\%$). Partitions Theory vs Practical Lab attendance. |
| **At-Risk Student Registry** | Cross-Module Engine | Deterministic scoring based on: Attendance $< 75\%$, Assignment completion $< 70\%$, Overdue submissions $> 0$, and Placement readiness $< 50\%$. Transparent reason codes provided. |
| **Academic Performance** | Phase 6 & Quiz Engine | Real evaluation scores from graded assignment submissions and timed quizzes. Categorized into standard academic grades: Grade A ($\ge 85\%$), Grade B ($70\% - 84.99\%$), Grade C ($55\% - 69.99\%$), Grade D ($40\% - 54.99\%$), Grade F ($< 40\%$). |
| **Assignment Analytics** | Phase 6 (`AssignmentService`) | Submission rate, On-time rate, Late submission rate, Grading completion rate, Pending grading backlog, and overdue submissions. |
| **Faculty Workload** | Phase 12 (`AcademicService`) | Strictly separates **Assigned Weekly Periods** from **Scheduled Timetable Periods**. Evaluates against maximum weekly capacity ($20$ periods/week) into `OVERLOADED`, `BALANCED`, or `UNDERUTILIZED`. |
| **Timetable & Room Utilization** | Phase 5 & 12 | Classroom utilization rate, Laboratory utilization rate, 6 daily academic period distribution, and available room tracking. |
| **Configuration Health** | Phase 12 (`auditConfigurationHealth`) | Integrated directly into the Executive Overview, reporting `HEALTHY`, `WARNING`, or `CRITICAL` with deep-links to remediation consoles. |
| **Event Analytics** | Phase 8 (`EventService`) | Total events, capacity utilization rate, category distribution (Technical, Cultural, Sports, Workshop, Seminar, Hackathon, Placement), and conversion. |
| **Club Analytics** | Phase 9 (`ClubService`) | Reuses the deterministic Club Engagement Score ($0 - 100$) and Tier Index (`ELITE`, `ACTIVE`, `DEVELOPING`, `PROBATIONARY`). |
| **Placement Analytics** | Phase 10 (`PlacementService`) | Recruitment funnel (`APPLIED`, `SHORTLISTED`, `INTERVIEW_SCHEDULED`, `SELECTED`, `REJECTED`), Readiness score distribution, and quiz attempt performance. |
| **Lost & Found Analytics** | Phase 11 (`LostFoundService`) | Resolution rate and category distribution without exposing private claimant verification answers. |
| **Notification Analytics** | Phase 13 (`NotificationService`) | Delivery volume, read rate, category distribution, and audience reach. |

---

## Role-Based Access Control (RBAC) & Privacy Matrix

| Endpoint | Permitted Roles | Data Scope Enforcement |
| :--- | :--- | :--- |
| `GET /api/analytics/overview` | `ADMIN` | Full institutional scope. |
| `GET /api/analytics/attendance` | `ADMIN`, `FACULTY` | Faculty scoped to mapped subjects/divisions; Admin scoped institution-wide. |
| `GET /api/analytics/at-risk` | `ADMIN`, `FACULTY` | Faculty restricted to authorized classes; Students blocked (`HTTP 403`). |
| `GET /api/analytics/academic` | `ADMIN`, `FACULTY` | Graded submissions and quiz results for authorized classes. |
| `GET /api/analytics/assignments` | `ADMIN`, `FACULTY` | Submission tracking and grading backlogs. |
| `GET /api/analytics/faculty-workload`| `ADMIN`, `FACULTY` | Faculty can only access own workload; IDOR attempts to view peer workload blocked (`HTTP 403`). |
| `GET /api/analytics/timetable` | `ADMIN`, `FACULTY` | Physical facilities and timetable period load. |
| `GET /api/analytics/events` | `ADMIN`, `FACULTY`, `CLUB_COORDINATOR`, `PLACEMENT_OFFICER` | Institutional event metrics. |
| `GET /api/analytics/clubs` | `ADMIN`, `CLUB_COORDINATOR`, `FACULTY` | Club coordinators view managed clubs; Admin views all. |
| `GET /api/analytics/placement` | `ADMIN`, `PLACEMENT_OFFICER` | Placement funnel and student readiness scores; Students blocked (`HTTP 403`). |
| `GET /api/analytics/lost-found` | `ADMIN`, `FACULTY` | Case resolution metrics without sensitive claim answers. |
| `GET /api/analytics/notifications` | `ADMIN` | System broadcast reach and category distribution. |
| `GET /api/analytics/department-comparison` | `ADMIN` | Comparative benchmarking across academic branches. |
| `GET /api/analytics/student` | `STUDENT`, `ADMIN` | Students receive only own analytics (`studentId` parameter locked to caller; peer IDOR blocked with `HTTP 403`). |
| `GET /api/analytics/faculty` | `FACULTY`, `ADMIN` | Faculty receive only own teaching statistics and authorized class rosters. |
| `GET /api/analytics/export/[report]` | `ADMIN`, `FACULTY`, `PLACEMENT_OFFICER`, `CLUB_COORDINATOR` | Strictly authorized CSV export; Students blocked (`HTTP 403`). |

---

## CSV Export Engine
The export engine generates standard RFC 4180 compliant CSV files with appropriate `Content-Type: text/csv` and `Content-Disposition: attachment; filename="report-*.csv"` headers.
Supported report types:
- `attendance`: Student ID, Roll Number, Name, Department, Conducted, Present, Absent, Percentage, Risk Status.
- `assignments`: ID, Title, Subject, Total Submissions, Submission Rate, On-Time Rate, Average Marks, Status.
- `faculty-workload`: Faculty ID, Name, Department, Assigned Weekly Hours, Scheduled Weekly Hours, Theory, Lab, Max Capacity, Status.
- `placement`: Drive ID, Company, Role, Batch, Minimum CGPA, Max Backlogs, Applications, Selected, Status.
- `events`: Event ID, Title, Category, Date, Capacity, Registrations, Utilization Rate, Status.
- `clubs`: Club ID, Name, Category, Member Count, Activities, Engagement Score, Tier, Status.
- `lost-found`: Report ID, Title, Type, Category, Location, Status, Date.

---

## User Interfaces

1. **Admin Intelligence Dashboard (`/dashboard/admin/analytics`)**:
   - Executive KPI cards with dynamic trend indicators and deep-links.
   - Filter bar supporting multi-dimension filtering (Department, Program, Batch, Semester, Division, Subject, Date Range).
   - Interactive Recharts components: Attendance Trends, Grade Distribution Pie, Department Comparison Bar Chart, and Faculty Workload Balance.
   - Deterministic At-Risk Student Registry with transparent risk reason tags.
   - Facilities utilization monitoring (Classroom vs Lab capacity).
   - One-click CSV export bar.
2. **Student Analytics Dashboard (`/dashboard/student/analytics`)**:
   - Focus on personal academic growth and self-improvement.
   - Attendance gauges with safe threshold projections.
   - Assignment submission and grading cards.
   - Placement readiness score and breakdown.
   - Registered events and club memberships.
3. **Faculty Analytics Dashboard (`/dashboard/faculty/analytics`)**:
   - Teaching workload breakdown (assigned vs scheduled periods, theory vs lab).
   - Mapped division attendance summary.
   - Grading completion and pending submission backlogs.
4. **Club Coordinator Analytics (`/dashboard/club/analytics`)**:
   - Member growth, activity counts, engagement tiers, and upcoming events.

---

## Verification Results

- **Automated Tests (Vitest)**:
  - 34 dedicated Phase 14 tests in `tests/integration/analytics.test.ts`.
  - **398/398 cumulative tests passing** across 17 test suites (0 failures).
- **Live HTTP API Assertions (`scripts/verify-api.mjs`)**:
  - Added assertions `AN0` through `AN42` (44 new assertions).
  - **475/475 cumulative live assertions passing** against the active Next.js server.
- **TypeScript Compilation**:
  - `npx tsc --noEmit`: 0 errors.
- **Next.js Production Build**:
  - `npm run build`: Compiled cleanly in 19.7s.
  - **139 total routes** generated and verified.
