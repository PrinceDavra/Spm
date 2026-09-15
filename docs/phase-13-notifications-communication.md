# Phase 13 — Campus Communication, Notifications & Smart Information Hub

## Overview

Phase 13 establishes the central communication nervous system of **CampusSphere — All-in-One College Ecosystem**. It unifies and coordinates alerts, circulars, and reminders across all previously delivered institutional modules:
- **Academic Setup & Governance** (Phase 12)
- **Lost & Found Community Board & Claims** (Phase 11)
- **Placement Drives & Timed Quizzes** (Phase 10)
- **Club Management & Activities** (Phase 9)
- **Campus Events & Calendar** (Phase 8)
- **Notices & Targeted Circulars** (Phase 7)
- **Assignments & Coursework** (Phase 6)
- **Deterministic CSP Timetable Engine** (Phase 5)
- **Attendance & Debarment Risk Projections** (Phase 4)

---

## 1. Notification Architecture & Engine

The notification subsystem operates with zero-trust server-side validation and automated deduplication:

```
Triggering Event (Assignment deadline / Attendance risk / Notice / Placement drive)
                           │
                           ▼
               [ NotificationService ]
                           │
        ┌──────────────────┴──────────────────┐
        ▼                                     ▼
[ Deduplication Check ]             [ Preference Filter ]
(dedupKey calculation)           (IN_APP / DISABLED check)
(Updates existing if unread)     (Critical SYSTEM/ACADEMIC protected)
        │                                     │
        └──────────────────┬──────────────────┘
                           ▼
                 [ Storage / Memory ]
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
[ In-App Header Bell ]  [ Notification Hub ]  [ Smart Feed Widget ]
  (Counter + Dropdown)   (/dashboard/notifs)    (Role Dashboards)
```

### Deduplication Engine
Every event computes a deterministic deduplication key:
`dedupKey = ${userId}:${type}:${sourceEntity}:${sourceId}:${action}`
If an identical unread notification was issued recently (e.g. within 24 hours), the service automatically updates the timestamp and message rather than flooding the user's feed with duplicate alerts.

### User Notification Preferences
Users can configure delivery channels for each notification category (`IN_APP`, `EMAIL`, `DISABLED`).
- **Critical Alert Protection**: `SYSTEM` and `ACADEMIC` notifications are classified as non-suppressible. Attempts to disable them are strictly rejected server-side with `HTTP 400`.
- **Email Channel Notice**: Clearly informs users that the campus email gateway is currently simulated/unconfigured on this node, delivering notifications reliably via in-app feeds.

---

## 2. Notification Priority Spectrum

Notifications support 4 distinct priority levels:
1. **`URGENT`**: Immediate campus action required (e.g. attendance debarment risk below 65%, timetable cancellations, emergency announcements).
2. **`HIGH`**: Time-sensitive academic or placement deadlines (e.g. assignment due in 24 hours, placement application closing).
3. **`NORMAL`**: Standard updates (e.g. published circulars, registered event reminders, pending coursework grading).
4. **`LOW`**: Informational updates (e.g. club activity announcements, community spotlights).

---

## 3. Smart Information Feed & Role-Aware Dashboards

The `/api/notifications/smart-feed` endpoint deterministically aggregates real-time intelligence tailored to the caller's role:

- **Student Feed**:
  - Immediate attendance risk warnings (based on `AttendanceService.getStudentSummary`).
  - Imminent assignment deadlines with relative countdowns ("Due today", "Due tomorrow", "2 days remaining").
  - Target-audience campus circulars filtered by department, semester, and division.
  - Registered event reminders with location coordinates.
  - Active placement recruitment drives where student meets CGPA criteria.
- **Faculty Feed**:
  - Pending assignment submissions ready for evaluation.
  - Timetable adjustments and room reassignments.
  - Departmental meetings and academic senate circulars.
- **Administrator Feed**:
  - Configuration health diagnostic alerts (unmapped courses, overloaded faculty).
  - Pending ownership claim verification requests in Lost & Found.
  - Campus-wide circular distribution statistics.

---

## 4. REST API Reference

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/notifications` | Authenticated | List user notifications with filtering, search & pagination |
| `PATCH` | `/api/notifications/[id]` | Owner Only | Toggle notification `isRead` status |
| `DELETE` | `/api/notifications/[id]` | Owner Only | Dismiss / delete notification |
| `POST` | `/api/notifications/mark-all-read` | Authenticated | Bulk mark all notifications as read for current user |
| `GET` | `/api/notifications/unread-count` | Authenticated | Fast indexed retrieval of active unread alerts count |
| `GET` | `/api/notifications/preferences` | Authenticated | Retrieve user channel preferences across all categories |
| `PATCH` | `/api/notifications/preferences` | Authenticated | Update category preferences (validates critical categories) |
| `GET` | `/api/notifications/smart-feed` | Authenticated | Retrieve role-tailored campus intelligence feed |
| `POST` | `/api/notices` | Authorized Roles | Publish targeted announcements with audience broadcast |

---

## 5. UI Components & Integration

1. **Persistent Header Bell (`components/layout/notification-bell.tsx`)**:
   - Integrated in `DashboardHeader` with live unread badge.
   - Interactive dropdown with recent alerts, priority tags, quick mark-read buttons, and deep-links.
2. **Notification Center (`/dashboard/notifications`)**:
   - Category filtering tabs (All, Unread, High Priority, Academic, Assignments, Events, Placement, Clubs, System).
   - Instant search and priority filters.
   - Category grouping toggle.
   - User notification preferences modal.
3. **Targeted Announcement Composer (`components/notifications/announcement-composer.tsx`)**:
   - Modal drawer for Admin, Faculty, Club Coordinators, and Placement Officers.
   - Granular audience targeting (All, Students, Faculty, Department, Semester, Division).
4. **Smart Campus Feed Widget (`components/notifications/smart-feed-widget.tsx`)**:
   - Embedded directly on Student, Faculty, and Admin dashboards.
   - Highlights urgent actions, approaching deadlines, and circulars.
5. **Sidebar Navigation**:
   - Integrated `{ name: "Notification Hub", href: "/dashboard/notifications", icon: BellRing }` across all 5 roles.

---

## 6. Verification & Verification Metrics

- **Dedicated Vitest Tests**: 30/30 tests passing (`tests/integration/notifications.test.ts`).
- **Cumulative Vitest Tests**: 364/364 tests passing across 16 test suites.
- **Dedicated Live HTTP Assertions**: 32 assertions passing (`NC1`–`NC22` + sub-checks in `scripts/verify-api.mjs`).
- **Cumulative Live HTTP Assertions**: 425/425 assertions passing with 0 failures.
- **TypeScript Status**: 0 errors (`tsc --noEmit` clean).
- **Next.js Production Build**: 0 errors (120 routes compiled).
- **Regression Protection**: Phases 1 through 12 (Auth, Profiles, Attendance, Timetable, Assignments, Notices, Events, Clubs, Placement, Lost & Found, Admin Management) 100% operational.
