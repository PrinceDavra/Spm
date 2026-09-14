import { describe, it, expect, beforeEach } from "vitest";
import { PlacementService } from "@/services/placement.service";
import { QuizService } from "@/services/quiz.service";
import {
  createCompanySchema,
  createDriveSchema,
  applyDriveSchema,
  updateApplicationStatusSchema,
  createQuestionSchema,
  createQuizSchema,
} from "@/validators/placement.schema";
import {
  EmploymentType,
  PlacementDriveStatus,
  ApplicationStatus,
  PrepCategory,
  QuestionDifficulty,
  AttemptStatus,
  Role,
} from "@prisma/client";
import {
  resetDemoPlacementsStore,
  DEMO_DRIVES_STORE,
  DEMO_APPLICATIONS_STORE,
  DEMO_QUIZ_ATTEMPTS_STORE,
} from "@/lib/placement/demo-placements";

describe("Phase 10 — Placement Drives, Prep Bank, Timed Quizzes & Application Tracker Tests", () => {
  beforeEach(() => {
    resetDemoPlacementsStore();
  });

  // =========================================================================
  // 1. UNIT TESTS: VALIDATION SCHEMAS & SANITIZATION
  // =========================================================================
  describe("1. Validation Schemas & Data Constraints", () => {
    it("1. validates a complete corporate partner payload", () => {
      const payload = {
        name: "Acme Robotics Systems",
        slug: "acme-robotics",
        industry: "Robotics & Automation",
        website: "https://acme-robotics.com",
        location: "Pune, India",
        companySize: "500+ employees",
        contactPerson: "Dr. Sarah Jenkins",
        contactEmail: "recruiting@acme-robotics.com",
      };
      const result = createCompanySchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("2. rejects company with empty or short name", () => {
      const payload = {
        name: "A",
        industry: "IT",
      };
      const result = createCompanySchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.name).toBeDefined();
      }
    });

    it("3. validates a complete placement drive creation payload", () => {
      const payload = {
        companyId: "comp-001",
        title: "Full Stack Engineer Campus Hiring 2026",
        role: "Software Development Engineer",
        employmentType: EmploymentType.FULL_TIME,
        location: "Hyderabad, India",
        packageMin: 18.5,
        packageMax: 24.0,
        currency: "INR",
        description: "Join Google Core Infrastructure team working on distributed systems.",
        applicationDeadline: "2026-10-30T23:59:59.000Z",
        minCgpa: 8.0,
        maxBacklogs: 0,
        allowedDepartments: ["Computer Engineering", "Information Technology"],
        allowedSemesters: [6, 7, 8],
        requiredSkills: ["C++", "Go", "Distributed Systems"],
      };
      const result = createDriveSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("4. rejects drive payload with negative package", () => {
      const payload = {
        companyId: "comp-001",
        title: "Invalid Package Drive",
        role: "Engineer",
        employmentType: EmploymentType.FULL_TIME,
        location: "Bangalore",
        packageMin: -5,
        packageMax: 10,
        description: "Description long enough for schema validation requirement.",
        applicationDeadline: "2026-10-30T23:59:59.000Z",
      };
      const result = createDriveSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("5. validates student application payload with optional cover note", () => {
      const payload = {
        resumeUrl: "https://campussphere.edu/resumes/tirth-resume.pdf",
        notes: "Excited about distributed algorithms and high-throughput systems.",
      };
      const result = applyDriveSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("6. rejects invalid resume URL in application schema", () => {
      const payload = {
        resumeUrl: "invalid-url-format",
      };
      const result = applyDriveSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("7. validates official application status transition payload", () => {
      const payload = {
        status: ApplicationStatus.INTERVIEW,
        remarks: "Candidate selected for Technical Round 2 based on OA score of 95%.",
      };
      const result = updateApplicationStatusSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("8. validates question authoring schema with 4 options and valid correct index", () => {
      const payload = {
        category: PrepCategory.DSA,
        question: "What is the worst-case time complexity of QuickSort?",
        options: ["O(n log n)", "O(n)", "O(n^2)", "O(log n)"],
        correctOptionIndex: 2,
        explanation: "QuickSort degrades to O(n^2) when the pivot choice partitions unbalanced subarrays.",
        difficulty: QuestionDifficulty.MEDIUM,
        topic: "Sorting Algorithms",
        marks: 2,
      };
      const result = createQuestionSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("9. rejects question where correctOptionIndex is out of bounds", () => {
      const payload = {
        category: PrepCategory.DSA,
        question: "Sample Question?",
        options: ["Option A", "Option B"],
        correctOptionIndex: 3, // Out of bounds for 2 options
        difficulty: QuestionDifficulty.EASY,
        topic: "Basics",
      };
      const result = createQuestionSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("10. validates quiz configuration schema", () => {
      const payload = {
        title: "Campus Diagnostic: Quantitative Aptitude",
        category: PrepCategory.QUANTITATIVE_APTITUDE,
        durationSeconds: 1200,
        questionCount: 10,
        totalMarks: 20,
        passingMarks: 12,
        questionIds: ["pq-001", "pq-002"],
      };
      const result = createQuizSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });
  });

  // =========================================================================
  // 2. COMPANY MANAGEMENT & RBAC
  // =========================================================================
  describe("2. Company Management & RBAC Permissions", () => {
    it("11. allows placement officer to create a new recruiting partner", async () => {
      const company = await PlacementService.createCompany(
        {
          name: "Stripe India",
          industry: "FinTech & Payments",
          website: "https://stripe.com",
          location: "Bangalore",
        },
        "demo-placement-001",
        Role.PLACEMENT_OFFICER
      );

      expect(company.id).toBeDefined();
      expect(company.name).toBe("Stripe India");
      expect(company.slug).toBe("stripe-india");
    });

    it("12. prevents non-placement officers (STUDENT) from creating companies", async () => {
      await expect(
        PlacementService.createCompany(
          {
            name: "HackerCorp",
            industry: "Security",
          },
          "demo-student-001",
          Role.STUDENT
        )
      ).rejects.toThrow(/Forbidden/);
    });

    it("13. prevents duplicate company registration with identical name", async () => {
      await expect(
        PlacementService.createCompany(
          {
            name: "Google India", // already pre-seeded
            industry: "Technology",
          },
          "demo-placement-001",
          Role.PLACEMENT_OFFICER
        )
      ).rejects.toThrow(/already exists/);
    });

    it("14. allows placement officer to update company details", async () => {
      const updated = await PlacementService.updateCompany(
        "comp-001",
        { location: "Bangalore & Hyderabad Campus" },
        "demo-placement-001",
        Role.PLACEMENT_OFFICER
      );

      expect(updated.location).toBe("Bangalore & Hyderabad Campus");
    });
  });

  // =========================================================================
  // 3. PLACEMENT DRIVE LIFECYCLE & VISIBILITY RULES
  // =========================================================================
  describe("3. Placement Drive Lifecycle & Role Scoping", () => {
    it("15. creates a new placement drive in DRAFT state", async () => {
      const drive = await PlacementService.createDrive(
        {
          companyId: "comp-001",
          title: "SRE Engineering Drive 2026",
          role: "Site Reliability Engineer",
          employmentType: EmploymentType.FULL_TIME,
          location: "Hyderabad",
          packageMin: 22,
          packageMax: 28,
          description: "Maintain 99.999% availability on globally distributed clusters.",
          applicationDeadline: "2026-11-15T23:59:59.000Z",
          minCgpa: 8.5,
          maxBacklogs: 0,
        },
        "demo-placement-001",
        Role.PLACEMENT_OFFICER
      );

      expect(drive.id).toBeDefined();
      expect(drive.status).toBe(PlacementDriveStatus.DRAFT);
    });

    it("16. conceals DRAFT drives from students during drive discovery", async () => {
      const studentView = await PlacementService.getDrives({
        userRole: Role.STUDENT,
        userId: "demo-student-001",
      });

      const hasDraft = studentView.drives.some(
        (d) => d.status === PlacementDriveStatus.DRAFT
      );
      expect(hasDraft).toBe(false);
    });

    it("17. displays DRAFT drives to placement officers for pre-launch editing", async () => {
      const officerView = await PlacementService.getDrives({
        userRole: Role.PLACEMENT_OFFICER,
        userId: "demo-placement-001",
      });

      const hasDraft = officerView.drives.some(
        (d) => d.status === PlacementDriveStatus.DRAFT
      );
      expect(hasDraft).toBe(true);
    });

    it("18. transitions drive from DRAFT to PUBLISHED and updates timestamp", async () => {
      const published = await PlacementService.publishDrive(
        "drv-013", // Tesla (DRAFT)
        "demo-placement-001",
        Role.PLACEMENT_OFFICER
      );

      expect(published.status).toBe(PlacementDriveStatus.PUBLISHED);
    });

    it("19. transitions drive to APPLICATION_CLOSED", async () => {
      const closed = await PlacementService.closeDrive(
        "drv-003", // Amazon SDE-1
        "demo-placement-001",
        Role.PLACEMENT_OFFICER
      );

      expect(closed.status).toBe(PlacementDriveStatus.APPLICATION_CLOSED);
    });
  });

  // =========================================================================
  // 4. SERVER-SIDE ELIGIBILITY ENGINE & EDGE CASES
  // =========================================================================
  describe("4. Server-Side Eligibility Engine & Edge Cases", () => {
    const sampleDrive = {
      id: "test-drv",
      minCgpa: 8.0,
      maxBacklogs: 0,
      allowedDepartments: ["Computer Engineering", "Information Technology"],
      allowedSemesters: [6, 7],
      batchCriteria: "2026",
    } as any;

    it("20. grants eligibility when all academic criteria pass", () => {
      const student = {
        cgpa: 8.74,
        activeBacklogs: 0,
        departmentName: "Computer Engineering",
        semester: 6,
        batchYear: "2026",
      };

      const evalResult = PlacementService.checkEligibility(sampleDrive, student);
      expect(evalResult.isEligible).toBe(true);
      expect(evalResult.failureReasons).toHaveLength(0);
    });

    it("21. rejects student whose CGPA is below cutoff with descriptive reason", () => {
      const student = {
        cgpa: 7.95, // below 8.0
        activeBacklogs: 0,
        departmentName: "Computer Engineering",
        semester: 6,
        batchYear: "2026",
      };

      const evalResult = PlacementService.checkEligibility(sampleDrive, student);
      expect(evalResult.isEligible).toBe(false);
      expect(evalResult.failureReasons[0]).toMatch(/below the required/);
    });

    it("22. boundary test: exact CGPA match satisfies eligibility", () => {
      const student = {
        cgpa: 8.0, // exact match
        activeBacklogs: 0,
        departmentName: "Computer Engineering",
        semester: 6,
        batchYear: "2026",
      };

      const evalResult = PlacementService.checkEligibility(sampleDrive, student);
      expect(evalResult.isEligible).toBe(true);
    });

    it("23. rejects student with active backlogs exceeding allowed threshold", () => {
      const student = {
        cgpa: 9.2,
        activeBacklogs: 1, // exceeds 0
        departmentName: "Computer Engineering",
        semester: 6,
        batchYear: "2026",
      };

      const evalResult = PlacementService.checkEligibility(sampleDrive, student);
      expect(evalResult.isEligible).toBe(false);
      expect(evalResult.failureReasons.some((r) => r.includes("backlogs"))).toBe(true);
    });

    it("24. rejects student from ineligible department", () => {
      const student = {
        cgpa: 8.5,
        activeBacklogs: 0,
        departmentName: "Civil Engineering", // Not in allowed list
        semester: 6,
        batchYear: "2026",
      };

      const evalResult = PlacementService.checkEligibility(sampleDrive, student);
      expect(evalResult.isEligible).toBe(false);
      expect(evalResult.failureReasons.some((r) => r.includes("department"))).toBe(true);
    });

    it("25. permits all branches when allowedDepartments is empty", () => {
      const openDrive = { ...sampleDrive, allowedDepartments: [] };
      const student = {
        cgpa: 8.5,
        activeBacklogs: 0,
        departmentName: "Mechanical Engineering",
        semester: 6,
        batchYear: "2026",
      };

      const evalResult = PlacementService.checkEligibility(openDrive, student);
      expect(evalResult.isEligible).toBe(true);
    });

    it("26. rejects student from wrong graduating batch", () => {
      const student = {
        cgpa: 8.5,
        activeBacklogs: 0,
        departmentName: "Computer Engineering",
        semester: 6,
        batchYear: "2025", // Drive expects 2026
      };

      const evalResult = PlacementService.checkEligibility(sampleDrive, student);
      expect(evalResult.isEligible).toBe(false);
      expect(evalResult.failureReasons.some((r) => r.includes("batch"))).toBe(true);
    });
  });

  // =========================================================================
  // 5. APPLICATION PIPELINE, AUDIT HISTORY & WITHDRAWALS
  // =========================================================================
  describe("5. Application Pipeline, Duplicate Prevention & Auditing", () => {
    it("27. allows eligible student to submit a valid application", async () => {
      // drv-003 is Amazon SDE-1 (minCgpa: 7.5, Computer Engineering)
      const app = await PlacementService.applyToDrive({
        driveId: "drv-003",
        studentUserId: "demo-student-001",
        resumeUrl: "https://campussphere.edu/resumes/tirth-resume.pdf",
        coverNote: "Passionate about full-stack enterprise solutions.",
      });

      expect(app.id).toBeDefined();
      expect(app.status).toBe(ApplicationStatus.APPLIED);
      expect(app.statusHistory).toHaveLength(1);
    });

    it("28. prevents duplicate active applications to the same drive", async () => {
      // drv-002 is already pre-seeded as app-001 for demo-student-001
      await expect(
        PlacementService.applyToDrive({
          driveId: "drv-002",
          studentUserId: "demo-student-001",
        })
      ).rejects.toThrow(/already submitted an active application/);
    });

    it("29. prevents student from applying to drive with deadline passed", async () => {
      // drv-012 has past deadline 2026-09-01 and is closed
      await expect(
        PlacementService.applyToDrive({
          driveId: "drv-012",
          studentUserId: "demo-student-001",
        })
      ).rejects.toThrow(/not currently open|passed/);
    });

    it("30. allows student to withdraw their active application and logs history", async () => {
      // app-002 is APPLIED
      const withdrawn = await PlacementService.withdrawApplication(
        "app-002",
        "demo-student-001"
      );

      expect(withdrawn.status).toBe(ApplicationStatus.WITHDRAWN);
      expect(withdrawn.statusHistory[0].newStatus).toBe(ApplicationStatus.WITHDRAWN);
    });

    it("31. prevents student from withdrawing an OFFERED application", async () => {
      const app = DEMO_APPLICATIONS_STORE.find((a) => a.studentUserId === "demo-student-001");
      if (app) {
        app.status = ApplicationStatus.OFFERED;
        await expect(
          PlacementService.withdrawApplication(app.id, "demo-student-001")
        ).rejects.toThrow(/Cannot withdraw/);
      }
    });

    it("32. allows placement officer to advance applicant to SHORTLISTED with remarks", async () => {
      const updated = await PlacementService.updateApplicationStatus({
        applicationId: "app-002",
        newStatus: ApplicationStatus.SHORTLISTED,
        remarks: "Resume scored in top decile of applicant pool.",
        officerUserId: "demo-placement-001",
        officerRole: Role.PLACEMENT_OFFICER,
      });

      expect(updated.status).toBe(ApplicationStatus.SHORTLISTED);
      expect(updated.statusHistory[0].remarks).toContain("top decile");
    });

    it("33. forbids student from changing official recruitment status", async () => {
      await expect(
        PlacementService.updateApplicationStatus({
          applicationId: "app-001",
          newStatus: ApplicationStatus.OFFERED,
          officerUserId: "demo-student-001",
          officerRole: Role.STUDENT,
        })
      ).rejects.toThrow(/Forbidden/);
    });

    it("34. forbids student from viewing another student's application record", async () => {
      // Seed an application for student-002
      DEMO_APPLICATIONS_STORE.push({
        id: "app-other-student",
        driveId: "drv-001",
        driveTitle: "Google SWE",
        companyName: "Google India",
        companyLogo: "",
        studentId: "STU-002",
        studentUserId: "demo-student-002",
        studentName: "Priya Sharma",
        studentEmail: "priya@campussphere.edu",
        rollNumber: "22COMPA102",
        departmentName: "Computer Engineering",
        semester: 6,
        cgpa: 9.1,
        activeBacklogs: 0,
        resumeUrl: "https://campussphere.edu/resumes/priya.pdf",
        status: ApplicationStatus.APPLIED,
        remarks: "Applied",
        appliedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        statusHistory: [],
      });

      await expect(
        PlacementService.getApplicationById("app-other-student", "demo-student-001", Role.STUDENT)
      ).rejects.toThrow(/Forbidden/);
    });
  });

  // =========================================================================
  // 6. QUESTION BANK & ANSWER KEY PROTECTION
  // =========================================================================
  describe("6. Preparation Question Bank & Security Controls", () => {
    it("35. allows placement officer to author a new prep question", async () => {
      const question = await QuizService.createQuestion(
        {
          category: PrepCategory.DBMS,
          question: "Which normal form eliminates partial dependency on composite keys?",
          options: ["1NF", "2NF", "3NF", "BCNF"],
          correctOptionIndex: 1,
          explanation: "Second Normal Form (2NF) ensures no non-prime attribute is partially dependent on any candidate key.",
          difficulty: QuestionDifficulty.MEDIUM,
          topic: "Normalization",
          marks: 2,
        },
        "demo-placement-001",
        Role.PLACEMENT_OFFICER
      );

      expect(question.id).toBeDefined();
      expect(question.correctOptionIndex).toBe(1);
    });

    it("36. critical security test: questions for students MUST NOT leak correct answers or explanations", async () => {
      const questions = await QuizService.getQuestions({
        userRole: Role.STUDENT,
      });

      expect(questions.length).toBeGreaterThan(0);
      for (const q of questions) {
        expect((q as any).correctOptionIndex).toBeUndefined();
        expect((q as any).explanation).toBeUndefined();
      }
    });

    it("37. officers and admins CAN inspect answer keys and explanations", async () => {
      const questions = await QuizService.getQuestions({
        userRole: Role.PLACEMENT_OFFICER,
      });

      expect(questions.length).toBeGreaterThan(0);
      expect((questions[0] as any).correctOptionIndex).toBeDefined();
      expect((questions[0] as any).explanation).toBeDefined();
    });
  });

  // =========================================================================
  // 7. TIMED QUIZ ENGINE & SERVER-SIDE GRADING
  // =========================================================================
  describe("7. Timed Quiz Engine, Auto-Submit & Server Scoring", () => {
    it("38. starts a timed quiz attempt with server-calculated expiresAt", async () => {
      const session = await QuizService.startAttempt(
        "qz-001", // Quantitative Aptitude
        "demo-student-001"
      );

      expect(session.attempt).toBeDefined();
      expect(session.attempt.status).toBe(AttemptStatus.IN_PROGRESS);
      expect(new Date(session.attempt.expiresAt).getTime()).toBeGreaterThan(
        new Date(session.attempt.startedAt).getTime()
      );
      // Ensure questions served to student in active attempt don't contain correct keys
      expect(session.questions[0].correctOptionIndex).toBeUndefined();
    });

    it("39. records selected answer during in-progress attempt", async () => {
      const session = await QuizService.startAttempt(
        "qz-002", // Logical Reasoning
        "demo-student-001"
      );

      const firstQuestionId = session.questions[0].id;
      const updated = await QuizService.recordAnswer(
        session.attempt.id,
        "demo-student-001",
        firstQuestionId,
        1
      );

      expect(updated.answers[firstQuestionId]).toBe(1);
    });

    it("40. prevents another student from recording answers into someone else's attempt", async () => {
      const session = await QuizService.startAttempt(
        "qz-003", // Verbal Ability
        "demo-student-001"
      );

      await expect(
        QuizService.recordAnswer(
          session.attempt.id,
          "demo-student-002", // Wrong student
          session.questions[0].id,
          0
        )
      ).rejects.toThrow(/Forbidden/);
    });

    it("41. authoritatively grades attempt server-side upon manual submission", async () => {
      const session = await QuizService.startAttempt(
        "qz-004", // DSA Assessment
        "demo-student-001"
      );

      // Submit attempt
      const result = await QuizService.submitAttempt(
        session.attempt.id,
        "demo-student-001"
      );

      expect(result.attempt.status).toBe(AttemptStatus.SUBMITTED);
      expect(result.score).toBeDefined();
      expect(result.totalMarks).toBeGreaterThan(0);
      expect(result.percentage).toBeGreaterThanOrEqual(0);
      // Explanations and answer keys are now revealed in the review payload
      expect(result.review.questions[0].correctOptionIndex).toBeDefined();
      expect(result.review.questions[0].explanation).toBeDefined();
    });

    it("42. auto-submits attempt when answering past timer expiration grace period", async () => {
      const session = await QuizService.startAttempt(
        "qz-005", // DBMS & OS
        "demo-student-001"
      );

      // Force-expire the attempt
      const att = DEMO_QUIZ_ATTEMPTS_STORE.find((a) => a.id === session.attempt.id);
      if (att) {
        att.expiresAt = new Date(Date.now() - 60000).toISOString(); // Expired 1 min ago
      }

      await expect(
        QuizService.recordAnswer(
          session.attempt.id,
          "demo-student-001",
          session.questions[0].id,
          2
        )
      ).rejects.toThrow(/Time limit expired/);

      // Verify auto-submitted
      expect(att?.status).toBe(AttemptStatus.SUBMITTED);
    });
  });

  // =========================================================================
  // 8. PLACEMENT READINESS SCORE & ANALYTICS
  // =========================================================================
  describe("8. Deterministic Placement Readiness Score & Institutional KPIs", () => {
    it("43. computes institutional Placement Readiness Score bounded between 0 and 100", async () => {
      const report = await QuizService.getStudentProgress(
        "demo-student-001",
        8.74,
        ["React", "TypeScript", "Node.js", "Python", "SQL", "Docker"],
        3
      );

      expect(report.readinessScore).toBeGreaterThanOrEqual(0);
      expect(report.readinessScore).toBeLessThanOrEqual(100);
      expect(report.readinessTier).toBeDefined();
      expect(report.componentScores.quizPerformance).toBeDefined();
      expect(report.componentScores.academicEligibility).toBeDefined();
    });

    it("44. returns strong and weak topics based on student attempt history", async () => {
      const report = await QuizService.getStudentReadinessScore("demo-student-001");
      expect(report.strongTopics.length).toBeGreaterThan(0);
      expect(report.weakTopics.length).toBeGreaterThan(0);
      expect(report.recommendedCategories.length).toBeGreaterThan(0);
    });

    it("45. returns institutional analytics including average package and funnel stages", async () => {
      const analytics = await PlacementService.getPlacementAnalytics(
        "demo-placement-001",
        Role.PLACEMENT_OFFICER
      );

      expect(analytics.totalDrives).toBeGreaterThan(0);
      expect(analytics.totalApplications).toBeGreaterThan(0);
      expect(analytics.averagePackageLPA).toBeGreaterThan(0);
      expect(analytics.conversionRate).toBeGreaterThanOrEqual(0);
      expect(analytics.stageBreakdown.applied).toBeDefined();
      expect(analytics.stageBreakdown.offered).toBeDefined();
    });
  });
});
