# Phase 9: Club Management, Membership & Coordinator Workflows

## 1. Executive Summary & Overview
Phase 9 delivers a comprehensive, production-grade **Club Management, Membership & Coordinator System** for CampusSphere. It serves as the institutional community and co-curricular backbone, connecting students, faculty mentors, club coordinators, and academic administrators.

The primary workflow supported is:
$$\text{Discover Clubs} \longrightarrow \text{View Club Detail} \longrightarrow \text{Join Club} \longrightarrow \text{Coordinator Review} \longrightarrow \text{Manage Members} \longrightarrow \text{Host Activities} \longrightarrow \text{Link Phase 8 Events} \longrightarrow \text{Track Deterministic Engagement}$$

All operations adhere to zero-trust server-side RBAC, transactional integrity, unified notification triggers, and seamless cross-module links to Phase 7 Notices, Phase 8 Events, Profile, and AuditLog systems.

---

## 2. Database Design & Relational Models

### 2.1 Prisma Schema Integration
The schema incorporates extended enums and three normalized models within PostgreSQL:

```prisma
enum ClubCategory {
  TECHNICAL
  CULTURAL
  SPORTS
  LITERARY
  SOCIAL
  ENTREPRENEURSHIP
  DESIGN
  ROBOTICS
  CODING
  OTHER
}

enum ClubStatus {
  DRAFT
  PUBLISHED
  ACTIVE
  SUSPENDED
  ARCHIVED
}

enum MembershipRole {
  MEMBER
  COORDINATOR
  FACULTY_ADVISOR
}

enum MembershipStatus {
  PENDING
  ACTIVE
  APPROVED
  REJECTED
  LEFT
}

enum ClubActivityType {
  MEETING
  WORKSHOP
  PRACTICE
  TRAINING
  COMPETITION_PREP
  COMMUNITY_SERVICE
  OTHER
}
```

### 2.2 Models
1. **Club (`Club`)**:
   - `id`: Unique identifier (`club-001`, `cuid`).
   - `name`, `slug`: Unique slug for URL routing.
   - `description`, `shortDescription`: Formatted markdown and preview briefs.
   - `category`: `ClubCategory` enum.
   - `departmentId`, `department`: Optional departmental affiliation.
   - `facultyAdvisorId`, `coordinatorId`: Foreign keys to User records.
   - `logoUrl`, `bannerUrl`: Unsplash curated photographic graphics.
   - `contactEmail`, `contactPhone`: Official public inquiries.
   - `status`: `ClubStatus` (`DRAFT`, `PUBLISHED`, `ACTIVE`, `SUSPENDED`, `ARCHIVED`).
   - `establishedYear`, `isRecruiting`: Institutional metadata.
   - Relations: `memberships` (`ClubMembership[]`), `activities` (`ClubActivity[]`), `events` (`Event[]`).

2. **ClubMembership (`ClubMembership`)**:
   - `id`: Unique membership record ID.
   - `clubId`: Relation to `Club`.
   - `userId`: Relation to `User` (student/faculty).
   - `role`: `MembershipRole` (`MEMBER`, `COORDINATOR`, `FACULTY_ADVISOR`).
   - `status`: `MembershipStatus` (`PENDING`, `ACTIVE`, `APPROVED`, `REJECTED`, `LEFT`).
   - `appliedAt`, `joinedAt`, `approvedAt`, `approvedBy`, `leftAt`: Exact auditing timestamps.
   - Constraint: `@@unique([clubId, userId])` strictly preventing duplicate applications or phantom records.

3. **ClubActivity (`ClubActivity`)**:
   - `id`: Activity identifier.
   - `clubId`: Parent club.
   - `title`, `description`: Scope of activity.
   - `activityDate`: Scheduled UTC datetime.
   - `activityType`: `ClubActivityType` enum.
   - `venue`: Physical room or lab on campus.
   - `createdBy`: Foreign key to Coordinator / Faculty creator.

---

## 3. Club Lifecycle & State Machine

```
      [Create Club]
            │
            ▼
        ┌───────┐      publish()      ┌───────────┐
        │ DRAFT │ ──────────────────> │ PUBLISHED │
        └───────┘                     └─────┬─────┘
                                            │
                                            ▼
                                       ┌──────────┐
               ┌────────────────────── │  ACTIVE  │ <─────────────────────┐
               │                       └────┬─────┘                       │
               │                            │                             │
    suspend()  ▼                            │ archive()        reinstate()│
        ┌───────────┐                       ▼                             │
        │ SUSPENDED │                 ┌──────────┐                        │
        └─────┬─────┘                 │ ARCHIVED │ ───────────────────────┘
              │                       └──────────┘
              └───────────────────────────────────┘
```

1. **`DRAFT`**:
   - Visible only to `ADMIN`.
   - Hidden from student discovery `/api/clubs` and direct route access returns `404 Not Found`.
2. **`PUBLISHED` / `ACTIVE`**:
   - Discoverable by all students and faculty.
   - Accepts new membership applications and activity scheduling.
3. **`SUSPENDED`**:
   - Flagged by institutional admin.
   - Rejects all incoming membership requests with `400 Bad Request`.
   - Halts activity scheduling and public event hosting.
4. **`ARCHIVED`**:
   - Read-only historical preservation.
   - Roster changes and new postings prohibited.

---

## 4. Role-Based Access Control (RBAC) Matrix

| Operation | Anonymous | Student | Faculty | Coordinator | Admin |
|:---|:---:|:---:|:---:|:---:|:---:|
| **Discover Clubs** (`GET /api/clubs`) | ❌ (401) | ✅ (Active) | ✅ (Active) | ✅ (Active) | ✅ (All) |
| **View Club Detail** (`GET /api/clubs/[id]`) | ❌ (401) | ✅ (Active) | ✅ (Active) | ✅ (Active) | ✅ (All) |
| **Apply to Join** (`POST /api/clubs/[id]/join`) | ❌ (401) | ✅ | ❌ (400) | ❌ (400) | ❌ (400) |
| **Leave Club** (`POST /api/clubs/[id]/leave`) | ❌ (401) | ✅ (Own) | ❌ | ❌ | ❌ |
| **View Member Roster** (`GET /api/clubs/[id]/members`) | ❌ (401) | ❌ (403) | ✅ (Advisor) | ✅ (Assigned) | ✅ (All) |
| **Approve/Reject Request** (`POST .../approve`, `/reject`) | ❌ (401) | ❌ (403) | ✅ (Advisor) | ✅ (Assigned) | ✅ (All) |
| **Remove/Promote Member** (`PATCH/DELETE .../members/[id]`) | ❌ (401) | ❌ (403) | ✅ (Advisor) | ✅ (Assigned) | ✅ (All) |
| **Schedule Activity** (`POST /api/clubs/[id]/activities`) | ❌ (401) | ❌ (403) | ✅ (Advisor) | ✅ (Assigned) | ✅ (All) |
| **Delete Activity** (`DELETE /api/clubs/[id]/activities/[id]`) | ❌ (401) | ❌ (403) | ✅ (Advisor) | ✅ (Assigned) | ✅ (All) |
| **Club Analytics** (`GET /api/clubs/[id]/analytics`) | ❌ (401) | ❌ (403) | ✅ (Advisor) | ✅ (Assigned) | ✅ (All) |
| **Create Club** (`POST /api/clubs`) | ❌ (401) | ❌ (403) | ❌ (403) | ❌ (403) | ✅ (Admin) |
| **Publish Club** (`POST /api/clubs/[id]/publish`) | ❌ (401) | ❌ (403) | ❌ (403) | ❌ (403) | ✅ (Admin) |
| **Update Club Info** (`PATCH /api/clubs/[id]`) | ❌ (401) | ❌ (403) | ✅ (Advisor) | ✅ (Assigned) | ✅ (Admin) |

---

## 5. Event & Notice Integrations

### 5.1 Reusing Phase 8 Events Architecture
Club public events (competitions, symposiums, hackathons) **do not duplicate event schemas**. Instead:
- Events in `EventService` and `EventStore` support `organizerRole: CLUB_COORDINATOR` and `clubId: string`.
- When fetching club details (`ClubService.getClubById`), the service queries the unified Event store (`eventStore.find({ clubId })`), appending upcoming registrations, capacities, dates, and live status.
- Clicking on any event card on `/dashboard/student/clubs/[id]` immediately navigates to `/dashboard/student/events/[id]`, honoring registration limits, waitlists, and QR tickets.

### 5.2 Notice Integration
- Departmental and club-level broadcasts leverage `NoticeService` with targeted audience criteria (`targetAudience: "CLUB_MEMBERS"` or specific role tags).

---

## 6. Deterministic Engagement Score Formula

CampusSphere strictly avoids opaque or fabricated "AI" scores. Club engagement is evaluated deterministically based on empirical participation telemetry:

$$\text{Score} = \min\left(100, \;\; \lfloor w_m \cdot S_{\text{members}} + w_e \cdot S_{\text{events}} + w_r \cdot S_{\text{registrations}} + w_a \cdot S_{\text{activities}} \rfloor\right)$$

Where:
- $S_{\text{members}} = \min(100, \; \text{Total Members} \times 4)$ (Weight $w_m = 0.25$)
- $S_{\text{events}} = \min(100, \; \text{Upcoming Events} \times 25)$ (Weight $w_e = 0.25$)
- $S_{\text{registrations}} = \min(100, \; \text{Cumulative Event Registrations} \times 2)$ (Weight $w_r = 0.25$)
- $S_{\text{activities}} = \min(100, \; \text{Scheduled Activities} \times 15)$ (Weight $w_a = 0.25$)

This metric is transparent, auditable, and directly incentivizes active student leadership and event hosting.

---

## 7. UI Components & Discovery Design System

1. **Student Club Discovery (`/dashboard/student/clubs`)**:
   - Hero Featured Club showcase with direct dynamic CTA.
   - Real-time search by name, slug, and descriptions.
   - Quick category chips: Technical, Robotics, Coding, Cultural, Sports, Literary, Social, Entrepreneurship, Design.
   - Sorting options: Member Count, Upcoming Events, Alphabetical, Recency.
   - Interactive badge statuses: `Member`, `Coordinator`, `Request Pending`, `Not a Member`.

2. **Club Detail View (`/dashboard/student/clubs/[id]`)**:
   - Photographic banner backdrop with verified club crest avatar.
   - Rich tabbed interface:
     - **About**: Detailed charter, mission statement, contact links, recruitment status.
     - **Activities**: Timeline of internal club meetings, practice sessions, workshops.
     - **Events**: Phase 8 linked events with available seat progress bars and registration CTAs.
     - **Leadership**: Faculty mentor and coordinator credentials.
   - Modal dialogs for `Join Application` (with personal statement) and `Confirm Resignation`.

3. **Student My Clubs (`/dashboard/student/clubs/my-clubs`)**:
   - Active Memberships section with role indicators and quick action shortcuts.
   - Pending Applications section showing submission timestamp and pending review notice.
   - Previous Clubs archive.

4. **Club Coordinator Station (`/dashboard/club`)**:
   - Top-level KPI metrics: Active Members, Pending Applications, Scheduled Activities, Linked Phase 8 Events, Real-time Engagement Score.
   - Pending Review Action Desk with 1-click Approve / Reject controls.
   - Sub-routes:
     - `/dashboard/club/members`: Full roster management, member removal, coordinator promotion.
     - `/dashboard/club/activities`: Interactive modal scheduler for workshops, meetings, and practices.

5. **Admin Club Governance (`/dashboard/admin/clubs`)**:
   - Institutional club directory with status management (`PUBLISHED`, `ACTIVE`, `SUSPENDED`, `ARCHIVED`).
   - Club creation modal with category assignment, advisor nomination, and coordinator assignment.

---

## 8. API Specifications & Routing

| Endpoint | Method | Auth | Body / Params | Response |
|:---|:---:|:---:|:---|:---|
| `/api/clubs` | `GET` | All | `?search=...&category=...&sort=...` | `{ success: true, clubs: Club[] }` |
| `/api/clubs` | `POST` | ADMIN | `CreateClubInput` | `{ success: true, club: Club }` (201) |
| `/api/clubs/[id]` | `GET` | All | `id` (or slug) | `{ success: true, club: ClubDetail }` |
| `/api/clubs/[id]` | `PATCH` | Coord / Admin | `UpdateClubInput` | `{ success: true, club: Club }` |
| `/api/clubs/[id]/publish` | `POST` | Admin | `id` | `{ success: true, club: Club }` |
| `/api/clubs/[id]/join` | `POST` | Student | `{ message?: string }` | `{ success: true, membership: ClubMembership }` (201) |
| `/api/clubs/[id]/leave` | `POST` | Student | `id` | `{ success: true, message: string }` |
| `/api/clubs/[id]/members` | `GET` | Coord / Admin | `id` | `{ success: true, members: [...], pending: [...] }` |
| `/api/clubs/[id]/members/[mid]/approve` | `POST` | Coord / Admin | `id`, `mid` | `{ success: true, membership: ClubMembership }` |
| `/api/clubs/[id]/members/[mid]/reject` | `POST` | Coord / Admin | `id`, `mid` | `{ success: true, membership: ClubMembership }` |
| `/api/clubs/[id]/members/[mid]` | `PATCH` | Coord / Admin | `{ role?: MembershipRole }` | `{ success: true, membership: ClubMembership }` |
| `/api/clubs/[id]/members/[mid]` | `DELETE` | Coord / Admin | `id`, `mid` | `{ success: true, message: string }` |
| `/api/clubs/[id]/activities` | `GET` | All | `id` | `{ success: true, activities: ClubActivity[] }` |
| `/api/clubs/[id]/activities` | `POST` | Coord / Admin | `CreateActivityInput` | `{ success: true, activity: ClubActivity }` (201) |
| `/api/clubs/[id]/activities/[aid]` | `DELETE` | Coord / Admin | `id`, `aid` | `{ success: true, message: string }` |
| `/api/clubs/[id]/analytics` | `GET` | Coord / Admin | `id` | `{ success: true, analytics: ClubAnalytics }` |
| `/api/clubs/my-clubs` | `GET` | Student | none | `{ success: true, activeClubs: [...], pendingApplications: [...] }` |

---

## 9. Verification, Test Results & Auditing

- **Unit & Integration Suite (`tests/integration/club.test.ts`)**:
  - 33 automated test cases covering validation, state transitions, duplicate prevention, membership lifecycle, coordinator boundaries, activity scheduling, and engagement metrics.
  - Overall suite: **201 tests passing across 12 test files**.
- **Live HTTP API Verification (`scripts/verify-api.mjs`)**:
  - 38 dedicated end-to-end checks (C1 through C38) testing live HTTP responses, session cookies, security denial boundaries, duplicate handling, and state synchronizations.
- **Audit Logging**:
  - Every membership approval, rejection, role change, and status transition automatically generates an institutional `AuditLog` entry.
- **Notifications**:
  - Automated `NotificationService` alerts dispatched for application submissions, coordinator approvals, rejections, and upcoming activities.
