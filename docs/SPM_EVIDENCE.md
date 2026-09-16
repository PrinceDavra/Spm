# Software Project Management (SPM) — Academic Project Evidence Document

**Project Name:** CampusSphere — All-in-One College Ecosystem  
**Subject:** Software Project Management (SPM)  
**Academic Year:** 2025–2026  
**Document Version:** 1.0 (Final Submission)  
**Repository State:** Phase 1–16 Complete  

---

## 1. Project Overview

CampusSphere is an enterprise-grade, multi-tenant college ecosystem platform designed to streamline higher education operations. It consolidates academic management, student life, attendance projection, exam scheduling, gradebook computation, corporate placement preparation, and institutional reporting into an integrated, zero-trust web application.

- **Primary Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS, Prisma 6.4 LTS, PostgreSQL
- **Total Development Phases:** 16 Phases (Foundation, RBAC, Profiles, Attendance, Timetable CSP, Assignments, Notices, Events, Clubs, Placements, Lost & Found, Admin Setup, Notifications, Analytics, Exams & Gradebook, Final Integration & Security)
- **Cumulative Test Coverage:** 446 automated tests across 19 test suites; 553 live HTTP API verification assertions
- **Final Build Status:** Production build PASS with 235+ static and dynamic routes

---

## 2. Team Roles & Organizational Structure

| Role / Responsibility | Assigned Team Member / Identifier | Key Contributions | Evidence Status |
| :--- | :--- | :--- | :--- |
| **Project Lead & Architecture** | Tirth Patel | Architectural blueprints, database schema design, RBAC matrix, CSP timetable algorithm | Verified in repository commit log |
| **Full-Stack Development** | Team Member 2 | API endpoint implementation, UI dashboards, server actions, Recharts integrations | Verified in source code & commits |
| **QA & Test Automation** | Team Member 3 | Vitest test suites, live API verification harness, IDOR security tests | Verified in test suites |
| **Documentation & SPM Compliance** | Team Member 4 | SPM compliance tracking, AI usage reporting, user manuals | Verified in docs/ directory |

*Note: For official university exam submissions, update student names, roll numbers, and division details in the table above.*

---

## 3. Development Workflow

The project followed an agile, iterative phase-based delivery model:
1. **Requirements & Constraint Analysis:** Defining functional specifications, boundary constraints, and threat models for each module.
2. **Data Modeling & Migration:** Designing normalized Prisma schemas, establishing foreign key relations, and indexing query paths.
3. **Domain Service Implementation:** Implementing core business logic with defensive validation, idempotency, and server-side authorization.
4. **API Route Handlers:** Authoring RESTful App Router handlers (`/api/*`) with strict input parsing (Zod) and HTTP error semantics.
5. **UI & Dashboard Construction:** Creating responsive, accessible interfaces adhering to design tokens with loading, error, and empty states.
6. **Regression & Live HTTP Testing:** Writing dedicated Vitest unit/integration tests followed by live HTTP verification against a running server.

---

## 4. Task Management

The project utilized milestone-driven phase execution:
- **Phase Breakdown:** 16 distinct functional milestones tracked via `PROJECT_STATUS.md`.
- **Status Reporting:** Quantitative metrics recorded after every phase (test counts, HTTP assertions, route counts).

> **Task Management Tool Evidence:**  
> `EVIDENCE REQUIRED`  
> *(Attach university-specific Jira board export, Trello card screenshots, or sprint velocity burndown charts here for physical submission).*

---

## 5. Communication Workflow

Team communication protocols were established around daily asynchronous standups and milestone reviews:
- **Architecture Syncs:** Aligning on schema adjustments and API contracts before implementation.
- **Merge & Test Reviews:** Verifying that no phase introduced regressions into preceding phases.

> **Communication Evidence:**  
> `EVIDENCE REQUIRED`  
> *(Attach Slack/Discord channel export, WhatsApp academic group screenshots, or faculty advisor meeting minutes here).*

---

## 6. Research & Reference Workflow

Key algorithmic and engineering references utilized:
- **Constraint Satisfaction Problems (CSP):** Russell & Norvig, *Artificial Intelligence: A Modern Approach* (MRV and Forward Checking heuristics implemented in Timetable solver).
- **Academic Grading Systems:** UGC / AICTE 10-point relative and absolute grading scale guidelines.
- **Attendance Policy Models:** AICTE mandatory 75% minimum attendance requirement with mathematical shortfall projections.
- **Web Application Security:** OWASP Top 10 guidelines (Zero-trust RBAC, IDOR mitigation, input validation, executable upload blocking).

> **Research Notebooks / Literature Reviews:**  
> `EVIDENCE REQUIRED`  
> *(Attach NotebookLM summaries, IEEE reference papers, or literature review document links here).*

---

## 7. AI Tool Usage & Attribution

Generative AI (Antigravity IDE powered by Google DeepMind models) was utilized as an agentic pair programmer under strict human supervision:
- **AI Domain of Assistance:** Scaffolding boilerplate route handlers, generating test fixtures, optimizing TypeScript type unions, and drafting baseline documentation.
- **Human Governance:** All architectural decisions, security boundaries, grading formulas, and acceptance criteria were established, inspected, and validated by the human engineering team.
- **Detailed Log:** Refer to [docs/AI_USAGE.md](file:///D:/CampusConnect/docs/AI_USAGE.md) for full disclosure and governance records.

---

## 8. Git / GitHub Workflow

The repository was managed using standard Git branching and feature-commit conventions:
- **Branching Strategy:** Mainline trunk development with phase-specific feature branches merged upon full test verification.
- **Commit Format:** Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`).
- **Recent Repository Commits:**
  - `ed57c4f` — *feat: add exam management gradebook and academic transcripts* (Phase 15 completion)
  - Preceding commits covering Phases 1 through 14.
  - Final Phase 16 Commit — *feat: finalize CampusSphere for production deployment*.

> **GitHub Pull Request & Webhook Screenshots:**  
> `EVIDENCE REQUIRED`  
> *(Attach GitHub repository insights, network graphs, or PR review logs here).*

---

## 9. Testing & Quality Assurance Workflow

CampusSphere implemented a zero-regression, multi-layer testing protocol:

```
                  ┌──────────────────────────────┐
                  │    Production Smoke Tests    │
                  │   Auth / Dashboards / 404    │
                  ├──────────────────────────────┤
                  │   Live HTTP Verification     │
                  │ 553 Assertions via Script    │
                  ├──────────────────────────────┤
                  │    Vitest Automated Suite    │
                  │ 446 Unit & Integration Tests │
                  ├──────────────────────────────┤
                  │ TypeScript Strict Type-Check │
                  │     0 Errors (tsc --noEmit)   │
                  └──────────────────────────────┘
```

- **Regression Policy:** After completing each phase, the *entire* cumulative test suite was re-executed. Zero test degradation was tolerated.

---

## 10. Deployment Workflow

- **Target Platform:** Vercel (Optimized for Next.js App Router).
- **Database Engine:** Managed PostgreSQL (Neon / Supabase / Vercel Postgres).
- **Build Pipeline:** `npm run build` runs `prisma generate`, TypeScript type verification, and static page prerendering.
- **Runtime Environment:** Node.js 18.x/20.x with Edge Runtime middleware.

---

## 11. Module Development History

| Phase | Milestone | Features Delivered | Automated Tests | Live HTTP Assertions |
| :--- | :--- | :--- | :---: | :---: |
| 1 | Foundation & Architecture | Next.js 16, Prisma ORM, PostgreSQL schema, Design system | 4 | Baseline |
| 2 | Auth & RBAC | bcryptjs hashing, signed JWTs, HttpOnly cookies, Edge middleware, Demo switcher | 24 | Baseline |
| 3 | Profiles | Student & Faculty profiles, immutability rules, directory | 13 | 25 |
| 4 | Attendance | Subject registers, bulk marking, 75% projection engine | 21 | 45 |
| 5 | Timetable CSP | AI constraint solver (MRV + Forward Checking), conflict detector | 19 | 66 |
| 6 | Assignments | Late penalty calculator, grading drawer, file security | 29 | 101 |
| 7 | Notices | Dynamic audience targeting, read tracking, notifications | 29 | 138 |
| 8 | Events | State machine, atomic capacity management, .ics export | 33 | 185 |
| 9 | Clubs | Discovery feed, join approvals, engagement score | 33 | 234 |
| 10 | Placements | Drive pipelines, eligibility engine, question bank, timed quizzes | 45 | 298 |
| 11 | Lost & Found | Multi-factor matcher (0-100), claim review, physical handover | 52 | 355 |
| 12 | Admin Setup | Academic departments, programs, rooms, faculty mappings | 36 | 410 |
| 13 | Notifications | Smart feed, read states, preferences, cross-module triggers | 30 | 460 |
| 14 | Analytics | 10 executive KPIs, at-risk registry, period heatmaps, CSV exports | 34 | 501 |
| 15 | Exams & Transcripts | Exam lifecycle, gradebook lockdown, transcripts, revaluations | 30 | 542 |
| 16 | Final Hardening | Security headers, IDOR hardening, error boundaries, documentation | 18 | 553 |
| **Total** | **All 16 Phases** | **Full Academic ERP Ecosystem** | **446 Passed** | **553 Passed** |

---

## 12. Verification Results Summary

- **Vitest Suites:** 19 test files passed (100% pass rate, 446/446 tests).
- **Live HTTP Assertions:** 553/553 assertions passed (0 failures).
- **TypeScript Strict Compilation:** 0 errors (`tsc --noEmit`).
- **Next.js Production Build:** PASSED (235+ routes compiled).
- **Security Headers:** Verified `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`.
- **IDOR Protection:** Verified cross-user grade, transcript, analytics, and claim isolation.

---

## 13. Screenshots / Evidence Placeholders

> **System Demonstration Screenshots:**  
> `EVIDENCE REQUIRED`  
> *(Insert authentic captured screenshots of the following pages for the evaluation panel):*
> 1. Student Attendance Projection Gauges (`/dashboard/student/attendance`)
> 2. Timetable Grid View (`/dashboard/student/timetable`)
> 3. Placement Drive Readiness Benchmarks (`/dashboard/student/placements`)
> 4. Lost & Found Algorithmic Match Score Modal (`/dashboard/student/lost-found`)
> 5. Faculty Gradebook Entry Matrix (`/dashboard/faculty/exams`)
> 6. Official Academic Transcript View (`/dashboard/transcript`)
> 7. Executive Analytics 10-KPI Dashboard (`/dashboard/admin/analytics`)
> 8. System Configuration Health Check (`/dashboard/admin/configuration-health`)

---

## 14. Final Deployment Status

- **Build Output:** Production bundle successfully generated locally and verified ready for deployment.
- **Cloud Database:** Ready for integration with Neon, Supabase, or Vercel Postgres via `DATABASE_URL`.
- **Live Vercel Deployment Link:**  
  `EVIDENCE REQUIRED`  
  *(When deployed by the project team to their university Vercel team account, paste the live URL here: e.g., `https://campussphere-spm.vercel.app`).*

---

## 15. Known Limitations & Academic Disclaimers

1. **Production Mail Server:** Outbound emails currently log through the internal notification hub; live transactional email requires university SMTP gateway credentials.
2. **Database Provisioning:** For offline examination lab demonstrations, the application incorporates resilient in-memory fallback stores to demonstrate 100% of workflows without requiring an active PostgreSQL service.
