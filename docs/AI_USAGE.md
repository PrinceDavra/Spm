# Artificial Intelligence (AI) Usage & Governance Disclosure

**Project Name:** CampusSphere — All-in-One College Ecosystem  
**Subject:** Software Project Management (SPM)  
**Document Purpose:** Academic Transparency & AI Attribution  
**Status:** Approved for Submission  

---

## 1. Executive Statement on AI Usage

This project was developed with the assistance of agentic artificial intelligence tools under strict human supervision, validation, and architectural direction. In adherence to academic integrity and ethical engineering standards, this document outlines the exact scope of AI involvement, testing procedures, human oversight, and the distribution of engineering responsibility.

---

## 2. Tools & Platforms Utilized

- **Primary Agentic Platform:** Google Antigravity IDE (powered by advanced Google DeepMind models).
- **Mode of Interaction:** Pair-programming, agentic CLI command execution, schema modeling assistance, and code inspection.
- **Human Role:** Lead System Architect, Product Owner, Quality Assurance Reviewer, and Academic Evaluator.

---

## 3. Scope of AI Assistance

AI assistance was utilized in the following areas:

### A. Architectural Exploration & Data Modeling
- Drafting initial relational schemas for Prisma ORM across 24+ entities.
- Suggesting foreign key constraints, cascade rules, and query indexes.
- Generating TypeScript interfaces to synchronize client and server data contracts.

### B. Algorithmic Formulation & Service Implementation
- **Timetable CSP Engine (Phase 5):** Implementing backtracking search with Minimum Remaining Values (MRV) and Forward Checking heuristics.
- **Attendance Projection Engine (Phase 4):** Formulating the mathematical projection equation to compute classes required for maintaining 75% attendance.
- **Lost & Found Matching Engine (Phase 11):** Writing the multi-factor scoring function weighing category match, date proximity, and text similarity.
- **Placement Readiness Scoring (Phase 10):** Translating the 5-component weighted readiness rubric into deterministic calculations.
- **Grading & GPA Engine (Phase 15):** Implementing 10-point relative and absolute grading scales, SGPA credit-weighting, and cumulative CGPA formulas.

### C. Test Harness & Test Generation
- Scaffolding Vitest unit and integration test suites covering all phases.
- Authoring exhaustive live HTTP API verification scripts (`scripts/verify-api.mjs`) containing 553 automated assertions.
- Generating boundary tests for IDOR vulnerabilities, role-based authorization, and input validation.

### D. UI Component Construction
- Building accessible, responsive Tailwind CSS dashboard layouts.
- Structuring Recharts data visualization components (bar charts, line graphs, radial gauges).
- Formatting unified error, loading, and empty states.

---

## 4. Limitations of AI-Generated Code Observed

During iterative development, AI-assisted code generation exhibited specific limitations that required human intervention:

1. **Context Drift & Breaking Schema Changes:** AI models occasionally proposed destructive Prisma schema changes or omitted relations required by earlier phases. Human reviewers strictly enforced backward compatibility.
2. **Missing Property Nuances:** In generated test files, optional fields or new union properties (such as `isAbsent: boolean` in gradebook inputs) were occasionally omitted, causing TypeScript compilation errors that required precise manual alignment.
3. **Over-Optimistic Mocking:** AI generation tended to rely on mock data rather than live database interactions. The human team mandated resilient dual-path architectures (PostgreSQL primary with graceful fallback catalogs).
4. **Environment Execution Quirks:** Certain Windows-specific command invocations (e.g. running `.ps1` scripts under strict execution policies) failed when generated generically; human guidance redirected commands through `cmd.exe /c`.

---

## 5. Code Review & Verification Process

Every line of code and test generated with AI assistance underwent the following four-tier verification process:

```
[AI Generation] ──► [Human Inspection & Diff Review] 
                 ──► [TypeScript Strict Check (tsc --noEmit)] 
                 ──► [Vitest Suite Execution (npm run test)] 
                 ──► [Live HTTP Verification (scripts/verify-api.mjs)]
```

- **Static Analysis:** Zero TypeScript errors permitted (`tsc --noEmit` clean).
- **Regression Testing:** Complete test suites re-run after every single change.
- **Zero Hallucination Policy:** No claimed test pass, route count, or deployment status was accepted without automated execution and log inspection.

---

## 6. Examples of AI-Generated Modules Tested & Refined

| Module | AI-Assisted Implementation | Human Verification & Refinement |
| :--- | :--- | :--- |
| **Attendance Projection** | Formulated basic difference equation | Adjusted for non-negative integers and edge cases where total lectures = 0 |
| **Timetable CSP** | Generated backtracking recursive solver | Added faculty workload ceilings and laboratory facility checks |
| **Exam Scheduling** | Built date/time conflict checker | Added room capacity validation, invigilator clashing, and 30-min minimum duration |
| **File Upload Security** | Suggested file extension checking | Hardened to inspect MIME signatures, block path traversal (`../../`), and reject executables |
| **Role-Based Guards** | Drafted basic session checks | Hardened to strict zero-trust server guards (`requireRole`) blocking IDOR on all queries |

---

## 7. Final Responsibility & Academic Ownership

While AI tools served as powerful productivity multipliers, the human project team maintains full and sole responsibility for:
- System design, security posture, and data privacy.
- Accuracy of academic evaluation and GPA formulas.
- Code correctness, maintainability, and absence of vulnerabilities.
- Verification results and documentation accuracy.

No claims of automated magic or unreviewed execution are made; this project represents rigorous software engineering guided by human judgment and assisted by state-of-the-art AI tooling.
