# Phase 12 — Admin Management: Academic Setup, Faculty Mapping, Rooms & Laboratories

## Overview

Phase 12 delivers the authoritative Academic Setup, Infrastructure, and Resource Management foundation for **CampusSphere — All-in-One College Ecosystem**. It establishes a centralized, zero-trust administrative control plane for institutions to define:

1. **Academic Hierarchy**: Departments, Programs/Courses, Batches, Academic Semesters, Classes, and Divisions.
2. **Curricular Setup**: Theory, Laboratory, and Elective Subjects with credit units, weekly teaching frequencies, and lab constraints.
3. **Faculty Resource Allocation**: Subject and Division mappings with deterministic teaching workload calculations.
4. **Physical & Specialized Infrastructure**: Physical Classrooms, Seminar Halls, Auditoriums, and specialized Laboratories with equipment inventory and capacity constraints.
5. **Deterministic Timetable Integration**: Authoritative prerequisite validation for the Phase 5 CSP timetable generator.
6. **Configuration Health Engine**: System-wide automated diagnostics classifying academic setups into `HEALTHY`, `WARNING`, and `CRITICAL` states with actionable remediation guidance.

---

## 1. Academic Hierarchy & Data Modeling

The academic hierarchy operates in a strict, parent-to-child relationship structure:

```
Department (e.g. Computer Science & Engineering)
  └── Program / Course (e.g. B.Tech Computer Engineering - 4 Years, 8 Sems)
      └── Batch (e.g. Batch 2026: 2022–2026)
          └── Academic Semester (e.g. Semester 6 / 2024-2025 Even)
              └── Class (e.g. Third Year B.Tech CSE - Sem 6)
                  └── Division (e.g. CE-A, CE-B - Capacity: 60)
                      └── Subjects & Faculty Assignments
```

### Prisma Schema Extensions

The existing database schema in `prisma/schema.prisma` was extended additively with zero breaking changes or destructive cascading deletes:

- **`Department`**: Added `isActive: Boolean` and `headOfDepartment: String?`.
- **`Program`**: New model representing degree programs (`code`, `degree`, `durationYears`, `totalSemesters`, `departmentId`, `isActive`).
- **`Batch`**: New model representing student intake cohorts (`name`, `startYear`, `endYear`, `programId`, `currentSemester`, `isActive`).
- **`AcademicSemester`**: New model representing academic terms (`semesterNumber`, `academicYear`, `term`, `startDate`, `endDate`, `isActive`).
- **`Class`**: Extended with `programId`, `batchId`, and `isActive`.
- **`Division`**: Extended with `code`, `capacity`, and `isActive`.
- **`Subject`**: Extended with `description`, `syllabusUrl`, `programId`, `laboratoryId`, `requiresLab`, and `isActive`.
- **`FacultySubject`**: Extended with `weeklyHours` and `isActive`.
- **`Room`**: Extended with `departmentId` and `isActive`.
- **`Laboratory`**: New model representing dedicated scientific and computing labs (`code`, `departmentId`, `roomId`, `capacity`, `equipment`, `labAssistant`, `isActive`).

---

## 2. Server-Side Security & RBAC Enforcement

All administrative mutations and sensitive endpoints are strictly guarded on the server side:

- **Zero-Trust Role Check**: Enforced via `checkRole([Role.ADMIN])` and `requireRole([Role.ADMIN])`.
- **Student & Faculty Blocking**: Any attempt by `STUDENT`, `FACULTY`, or unauthorized roles to mutate departments, programs, classes, divisions, subjects, mappings, rooms, or laboratories yields an immediate `403 Forbidden` response.
- **Auditing**: Every create, update, deactivate, map, or unmap operation records an `AuditLog` entry detailing the acting administrator, action type, entity, and metadata payload.

---

## 3. Workload Calculation & Resource Validation

### Deterministic Faculty Workload Engine
The `AcademicService.calculateFacultyWorkload()` utility computes:
- **Total Assigned Subjects & Divisions**: Aggregated across all active mappings.
- **Weekly Theory vs. Lab Periods**: Distinguishing 1-hour lecture blocks from 2-hour continuous laboratory sessions.
- **Assigned vs. Scheduled Teaching Workload**: Authoritatively cross-checked against timetable slot allocations.
- **Maximum Workload Warnings**: Alerts administrators if any faculty member exceeds institutional weekly teaching caps (e.g. >20 hours/week).

### Timetable Solver Integration (`validateTimetablePrerequisites`)
Before generating timetables via the Phase 5 engine, Phase 12 validates:
1. Every active division has active subjects assigned.
2. Every active subject is mapped to at least one designated faculty member.
3. Every lab subject (`requiresLab = true` or `type = LAB`) is linked to a valid, active laboratory with compatible equipment and room capacity.
4. Physical classrooms and laboratories are active and available.

---

## 4. REST API Reference

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/admin/academic/departments` | ADMIN | List all departments with filter & statistics |
| `POST` | `/api/admin/academic/departments` | ADMIN | Create new department with unique code |
| `GET` | `/api/admin/academic/departments/[id]` | ADMIN | Retrieve department with related entities |
| `PATCH` | `/api/admin/academic/departments/[id]` | ADMIN | Update department metadata |
| `DELETE` | `/api/admin/academic/departments/[id]` | ADMIN | Soft-deactivate department |
| `GET` | `/api/admin/academic/programs` | ADMIN | List programs by department |
| `POST` | `/api/admin/academic/programs` | ADMIN | Create degree program |
| `GET` | `/api/admin/academic/batches` | ADMIN | List student batches |
| `POST` | `/api/admin/academic/batches` | ADMIN | Create batch with endYear > startYear check |
| `GET` | `/api/admin/academic/semesters` | ADMIN | List academic semesters |
| `POST` | `/api/admin/academic/semesters` | ADMIN | Create academic semester configuration |
| `GET` | `/api/admin/academic/classes` | ADMIN | List classes |
| `POST` | `/api/admin/academic/classes` | ADMIN | Create class linked to program & batch |
| `GET` | `/api/admin/academic/divisions` | ADMIN | List divisions by class |
| `POST` | `/api/admin/academic/divisions` | ADMIN | Create division with capacity validation |
| `GET` | `/api/admin/academic/subjects` | ADMIN | List subjects with type & lab filters |
| `POST` | `/api/admin/academic/subjects` | ADMIN | Create subject (THEORY, LAB, ELECTIVE) |
| `GET` | `/api/admin/academic/faculty-mappings` | ADMIN | List faculty-to-subject-division mappings |
| `POST` | `/api/admin/academic/faculty-mappings` | ADMIN | Map faculty to division subject |
| `DELETE` | `/api/admin/academic/faculty-mappings/[id]` | ADMIN | Unmap faculty assignment |
| `GET` | `/api/admin/academic/faculty-mappings/workload` | ADMIN, FACULTY | Query deterministic workload summary |
| `GET` | `/api/admin/academic/rooms` | ADMIN | List physical rooms & halls |
| `POST` | `/api/admin/academic/rooms` | ADMIN | Create room with capacity check |
| `GET` | `/api/admin/academic/laboratories` | ADMIN | List laboratories with equipment inventory |
| `POST` | `/api/admin/academic/laboratories` | ADMIN | Create lab linked to room & department |
| `GET` | `/api/admin/academic/health` | ADMIN | Execute system-wide configuration health audit |

---

## 5. Administrative UI Console

The Phase 12 interface is integrated into the Admin navigation panel with dedicated management consoles:

- **Academic Setup Hub** (`/dashboard/admin/academic`): Overview of departments, programs, batches, and divisions with high-level statistics.
- **Department Manager** (`/dashboard/admin/departments`): Department CRUD, status toggling, and HOD assignment.
- **Program & Degree Manager** (`/dashboard/admin/programs`): Program and cohort curriculum configuration.
- **Class & Division Manager** (`/dashboard/admin/classes`): Class rosters, section creation, and student capacity settings.
- **Subject & Course Catalog** (`/dashboard/admin/subjects`): Subject catalog with credit allocations and laboratory requirement toggles.
- **Faculty Mapping & Workload Hub** (`/dashboard/admin/faculty-mapping`): Interactive allocation table with workload period meters.
- **Rooms & Laboratories Facility Desk** (`/dashboard/admin/rooms`): Infrastructure inventory, room types, and equipment catalogs.
- **Configuration Health Monitor** (`/dashboard/admin/configuration-health`): Live diagnostic audit displaying systematic checks, error summaries, and remediation recommendations.

---

## 6. Verification & Test Metrics

- **Dedicated Vitest Tests**: 36/36 tests passing (`tests/integration/admin-academic.test.ts`).
- **Cumulative Automated Vitest Tests**: 334/334 tests passing across 15 test suites.
- **Dedicated Live API Assertions**: 38 assertions passing (`AM1`–`AM35` + sub-checks in `scripts/verify-api.mjs`).
- **Cumulative Live API Assertions**: 393/393 assertions passing with 0 failures.
- **TypeScript Status**: 0 errors (`tsc --noEmit` clean).
- **Next.js Production Build**: 0 errors (115 routes compiled).
- **Regression Protection**: Phases 1 through 11 (Auth, Profiles, Attendance, Timetable, Assignments, Notices, Events, Clubs, Placement, Lost & Found) fully intact.
