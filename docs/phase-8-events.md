# Phase 8 — Events Discovery, Capacity Management & Registration System

## 1. Executive Architecture Summary

Phase 8 introduces an institutional-grade event management and discovery platform to CampusSphere. The system orchestrates the complete lifecycle:
$$\text{Authoring} \longrightarrow \text{Validation} \longrightarrow \text{Publishing} \longrightarrow \text{Discovery} \longrightarrow \text{Atomic Capacity Check} \longrightarrow \text{Ticket Generation} \longrightarrow \text{Attendance} \longrightarrow \text{Analytics}$$

Designed for multi-role university operations, the module empowers Admins, Faculty, Club Coordinators, and Placement Officers to host hackathons, technical workshops, cultural galas, sports tournaments, and recruitment drives with strict concurrency safeguards and real-time attendance telemetry.

---

## 2. Database Models & Schema Design

Normalized models in `prisma/schema.prisma` support complete event discovery, registration, and attendance tracking:

### 2.1 Enums
- **`EventStatus`**: `DRAFT`, `PUBLISHED`, `REGISTRATION_OPEN`, `REGISTRATION_CLOSED`, `COMPLETED`, `ARCHIVED`.
- **`EventCategory`**: `WORKSHOP`, `SEMINAR`, `HACKATHON`, `CULTURAL`, `SPORTS`, `CLUB`, `PLACEMENT`, `TECHNICAL`, `COMPETITION`, `WEBINAR`, `OTHER`.
- **`EventAttendanceStatus`**: `UNMARKED`, `PRESENT`, `ABSENT`.
- **`RegistrationStatus`**: `REGISTERED`, `CANCELLED`, `ATTENDED`.

### 2.2 `Event` Model
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `String` (UUID) | Primary key |
| `slug` | `String` (Unique) | URL-safe slug for clean routing |
| `title` | `String` | Event title (3-150 chars) |
| `summary` | `String?` | Summary string for card grids & notifications |
| `description` | `String` | Markdown-formatted description & tracks |
| `category` | `EventCategory` | Categorization enum |
| `status` | `EventStatus` | Lifecycle state |
| `organizerId` | `String` | Reference to `User` (Admin, Faculty, Club Lead, Placement Officer) |
| `venue` | `String` | Venue name or online link |
| `roomId` | `String?` | Optional physical room relation |
| `eventDate` | `DateTime` | Event scheduled date |
| `startDateTime` | `DateTime` | Event start timestamp |
| `endDateTime` | `DateTime` | Event end timestamp |
| `registrationOpenAt` | `DateTime` | Registration commencement timestamp |
| `registrationDeadline` | `DateTime` | Hard RSVP cutoff |
| `capacity` | `Int` | Maximum student seat limit |
| `posterUrl` | `String?` | Event banner visual URL |
| `isPublished` | `Boolean` | Visibility flag |

### 2.3 `EventRegistration` Model
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `String` (UUID) | Primary key |
| `eventId` | `String` | Foreign key to `Event` |
| `userId` | `String` | Foreign key to `User` |
| `studentId` | `String?` | Foreign key to `Student` profile |
| `confirmationCode` | `String` | Formatted ticket identifier (`CS-EVT-XXXXX`) |
| `registeredAt` | `DateTime` | Reservation timestamp |
| `status` | `RegistrationStatus` | `REGISTERED`, `CANCELLED`, `ATTENDED` |
| `attendanceStatus` | `EventAttendanceStatus`| `UNMARKED`, `PRESENT`, `ABSENT` |
| `attendedAt` | `DateTime?` | Entrance verification timestamp |
| `markedBy` | `String?` | User ID of verifier/organizer |
| `cancelledAt` | `DateTime?` | Cancellation timestamp |

**Integrity Constraints:**
- `@@unique([eventId, userId])`: Strictly prevents duplicate active registrations.
- `@@index([userId])`, `@@index([eventId, status])`: Optimizes student queries and organizer rosters.

---

## 3. Event Lifecycle State Machine

```
   ┌─────────┐
   │  DRAFT  │ (Invisible to students; editable only by organizer & admin)
   └────┬────┘
        │ Publish
        ▼
┌───────────────────┐
│ REGISTRATION_OPEN │ (Public in discovery feed; accepts registrations if capacity > 0)
└───────┬───────────┘
        │ Close / Deadline
        ▼
┌─────────────────────┐
│ REGISTRATION_CLOSED │ (Event full or RSVP deadline passed)
└───────┬─────────────┘
        │ Event Concludes
        ▼
┌───────────────────┐
│     COMPLETED     │ (Read-only for students; attendance & analytics archived)
└───────┬───────────┘
        │ Admin Action
        ▼
┌───────────────────┐
│     ARCHIVED      │ (Terminal state; immutable historical record)
└───────────────────┘
```

---

## 4. Atomic Capacity & Concurrency Enforcement

To prevent overbooking when multiple students attempt to register simultaneously for the final seat:
1. **Active Seat Calculation:**
   $$\text{Active Registrations} = \sum (\text{status} \in \{\text{REGISTERED}, \text{ATTENDED}\})$$
   $$\text{Seats Remaining} = \max(0, \text{Capacity} - \text{Active Registrations})$$
2. **Transaction-Safe Seat Claim:**
   Inside `EventService.registerForEvent`:
   - Checks event status is `REGISTRATION_OPEN` or `PUBLISHED`.
   - Validates that current time is within `registrationOpenAt` and `registrationDeadline`.
   - Checks existing registration for `userId` (rejects with HTTP 400).
   - Atomically evaluates `activeCount < capacity`. If full, immediately rejects with `"Event capacity has been reached. No seats available."`
3. **Seat Restoration on Cancellation:**
   - Calling `cancelRegistration` updates the student's registration status to `CANCELLED`, immediately incrementing `seatsRemaining` and allowing waiting peers to register.

---

## 5. Role-Based Access Control (RBAC)

| Capability | Student | Faculty (Organizer) | Admin | Club / Placement |
| :--- | :---: | :---: | :---: | :---: |
| Browse Published Events | Yes | Yes | Yes | Yes |
| View Event Drafts | No | Own drafts only | All | Own drafts only |
| Register for Event | Yes | No | Yes | No |
| Cancel Own Registration | Yes | N/A | Yes | N/A |
| Download iCalendar (.ics) | Yes | Yes | Yes | Yes |
| Create New Event | No | Yes | Yes | Yes |
| Edit Event | No | Own events | All | Own events |
| Publish Event | No | Own events | All | Own events |
| View Participant Roster | No | Own events | All | Own events |
| Mark Participant Attendance | No | Own events | All | Own events |
| View Real Analytics | No | Own events | All | Own events |

---

## 6. End-User Interface Features

1. **Student Event Discovery Flagship (`/dashboard/student/events`)**:
   - High-impact Hero Featured card with date, venue, category, seats left, and direct CTA.
   - Dynamic event card grid with live capacity badges: `Seats Left`, `Filling Fast` ($\le 30\%$), `Almost Full` ($\le 10\%$), `Event Full`, `Registration Closed`, `Completed`.
   - Category chips filter, search filter, tab filter (`All`, `Upcoming`, `My RSVP`, `Completed`), and sorting.
2. **Student Event Detail Page (`/dashboard/student/events/[id]`)**:
   - Banner imagery, category badge, schedule timeline, venue, organizer credentials.
   - Dynamic CTA: "Register Now" (triggers confirmation dialog), "You're Registered ✓" (with ticket pass and `.ics` download), "Event Full", "Registration Closed".
   - One-click iCalendar export (`.ics`).
3. **Student My Events (`/dashboard/student/events/registered`)**:
   - Tabs for "Upcoming Registered" and "Past & Attended".
   - Shows confirmation codes, attendance status (Present/Absent/Unmarked), and seat cancellation action.
4. **Organizer Event Hub (`/dashboard/faculty/events`)**:
   - KPIs: Active Events, Total Registrations, Seats Available, Average Attendance Rate.
   - Comprehensive event moderation table with status tags, capacity bars, and quick actions.
   - "Create New Event" modal dialog with validation for dates, venue, and capacity.
5. **Participant Roster & Attendance Manager (`/dashboard/faculty/events/[id]/participants`)**:
   - Searchable participant roster with student name, roll number, department, semester, ticket code.
   - Attendance toggle buttons (`Present` / `Absent`) with instant server persistence.
   - Live telemetry bar showing Attendance Rate %, Present count, and No-show count.

---

## 7. API Reference

| Endpoint | Method | Role | Description |
| :--- | :---: | :---: | :--- |
| `/api/events` | `GET` | Authenticated | Scoped event discovery feed with filters |
| `/api/events` | `POST` | Faculty/Admin/Staff | Create a new campus event |
| `/api/events/[id]` | `GET` | Authenticated | Single event detail with registration state |
| `/api/events/[id]` | `PATCH` | Organizer/Admin | Update event configuration |
| `/api/events/[id]/publish` | `POST` | Organizer/Admin | Publish draft and open registrations |
| `/api/events/[id]/register` | `POST` | Student/Admin | Register student with atomic capacity check |
| `/api/events/[id]/cancel-registration` | `POST` | Student/Admin | Cancel active registration & free seat |
| `/api/events/[id]/participants` | `GET` | Organizer/Admin | Participant roster with search & filters |
| `/api/events/[id]/attendance` | `POST` | Organizer/Admin | Mark participant Present/Absent |
| `/api/events/[id]/analytics` | `GET` | Organizer/Admin | Calculated attendance & capacity analytics |
| `/api/events/registered` | `GET` | Authenticated | Student's upcoming & past registrations |
| `/api/events/[id]/calendar` | `GET` | Authenticated | Download RFC 5545 `.ics` calendar invite |

---

## 8. Verification & Quality Gates

- **TypeScript compilation (`tsc --noEmit`)**: 0 errors.
- **Vitest integration test suite**: 11 passed test files, 168 passed tests (including 33 dedicated Phase 8 tests).
- **Next.js production build (`npm run build`)**: 57 compiled routes (0 errors).
- **Live HTTP test suite (`scripts/verify-api.mjs`)**: 185 passed assertions (including 38 dedicated Phase 8 live HTTP checks).
