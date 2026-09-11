import { describe, it, expect, beforeEach } from "vitest";
import { NoticeService } from "@/services/notice.service";
import {
  createNoticeSchema,
  isSafeAttachment,
} from "@/validators/notice.schema";
import {
  NoticeCategory,
  NoticePriority,
  NoticeAudience,
  NoticeStatus,
  Role,
} from "@prisma/client";
import {
  resetDemoNoticesStore,
  DEMO_NOTICES_STORE,
} from "@/lib/notice/demo-notices";

describe("Phase 7 — Notices, Announcements & Communication System Tests", () => {
  beforeEach(() => {
    resetDemoNoticesStore();
  });

  // =========================================================================
  // 1. UNIT TESTS: VALIDATION & ATTACHMENT SECURITY
  // =========================================================================
  describe("Notice Validation & Attachment Security", () => {
    it("1. should validate correct notice creation payload", () => {
      const validPayload = {
        title: "Mid-Term Examination Schedule Announcement",
        summary: "Detailed schedule for all semester 6 students.",
        content: "Examinations commence on March 25, 2025. Please review the timetable.",
        category: NoticeCategory.EXAMINATION,
        priority: NoticePriority.IMPORTANT,
        audience: NoticeAudience.STUDENTS,
      };

      const result = createNoticeSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it("2. should reject notice with title shorter than 3 characters", () => {
      const invalidPayload = {
        title: "No",
        content: "Valid notice body content exceeding min length.",
        category: NoticeCategory.GENERAL,
      };

      const result = createNoticeSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.title).toBeDefined();
      }
    });

    it("3. should reject notice with content shorter than 5 characters", () => {
      const invalidPayload = {
        title: "Valid Notice Title",
        content: "Hey",
        category: NoticeCategory.ACADEMIC,
      };

      const result = createNoticeSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.content).toBeDefined();
      }
    });

    it("4. should reject expiry date earlier than publish date", () => {
      const invalidPayload = {
        title: "Dated Notice Title",
        content: "Detailed circular message body.",
        category: NoticeCategory.GENERAL,
        publishDate: "2025-04-10T10:00:00.000Z",
        expiryDate: "2025-04-01T10:00:00.000Z", // Earlier than publish
      };

      const result = createNoticeSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.expiryDate).toBeDefined();
      }
    });

    it("5. should block executable files and scripts in attachments", () => {
      expect(isSafeAttachment("malicious_script.exe")).toBe(false);
      expect(isSafeAttachment("payload.bat")).toBe(false);
      expect(isSafeAttachment("command.cmd")).toBe(false);
      expect(isSafeAttachment("script.sh")).toBe(false);
      expect(isSafeAttachment("installer.msi")).toBe(false);
      expect(isSafeAttachment("macro.vbs")).toBe(false);
      expect(isSafeAttachment("exploit.ps1")).toBe(false);
    });

    it("6. should block directory traversal in attachment filenames", () => {
      expect(isSafeAttachment("../../../etc/passwd")).toBe(false);
      expect(isSafeAttachment("..\\secret\\document.pdf")).toBe(false);
      expect(isSafeAttachment("subfolder/file.pdf")).toBe(false);
    });

    it("7. should permit safe university attachment extensions", () => {
      expect(isSafeAttachment("Exam_TimeTable_2025.pdf")).toBe(true);
      expect(isSafeAttachment("Syllabus_Curriculum.docx")).toBe(true);
      expect(isSafeAttachment("Marks_Summary.xlsx")).toBe(true);
      expect(isSafeAttachment("Presentation_Deck.pptx")).toBe(true);
      expect(isSafeAttachment("Source_Code_Bundle.zip")).toBe(true);
    });
  });

  // =========================================================================
  // 2. AUDIENCE TARGETING & VISIBILITY LOGIC
  // =========================================================================
  describe("Audience Targeting & Scoping Logic", () => {
    it("8. student should receive notices targeted to ALL and STUDENTS", async () => {
      const { notices } = await NoticeService.getNotices({
        userId: "demo-student-001",
        role: Role.STUDENT,
        departmentId: "dept-comp",
        divisionId: "div-comp-a",
        semester: 6,
      });

      const hasAllNotice = notices.some((n) => n.audience === NoticeAudience.ALL);
      const hasStudentsNotice = notices.some((n) => n.audience === NoticeAudience.STUDENTS);

      expect(hasAllNotice).toBe(true);
      expect(hasStudentsNotice).toBe(true);
    });

    it("9. student should receive notices targeted to their department and division", async () => {
      const { notices } = await NoticeService.getNotices({
        userId: "demo-student-001",
        role: Role.STUDENT,
        departmentId: "dept-comp",
        divisionId: "div-comp-a",
        semester: 6,
      });

      const divANotice = notices.find((n) => n.id === "notice-009");
      expect(divANotice).toBeDefined();
      expect(divANotice?.divisionId).toBe("div-comp-a");
    });

    it("10. student must NOT receive notices targeted to another department", async () => {
      const { notices } = await NoticeService.getNotices({
        userId: "demo-student-001",
        role: Role.STUDENT,
        departmentId: "dept-comp",
        divisionId: "div-comp-a",
        semester: 6,
      });

      // notice-015 is targeted to Mechanical Engineering (dept-mech)
      const mechNotice = notices.find((n) => n.id === "notice-015");
      expect(mechNotice).toBeUndefined();
    });

    it("11. student must NOT receive notices targeted to another division", async () => {
      const { notices } = await NoticeService.getNotices({
        userId: "demo-student-001",
        role: Role.STUDENT,
        departmentId: "dept-comp",
        divisionId: "div-comp-a",
        semester: 6,
      });

      // notice-016 is targeted to Division B
      const divBNotice = notices.find((n) => n.id === "notice-016");
      expect(divBNotice).toBeUndefined();
    });

    it("12. student must NOT receive notices targeted exclusively to FACULTY", async () => {
      const { notices } = await NoticeService.getNotices({
        userId: "demo-student-001",
        role: Role.STUDENT,
        departmentId: "dept-comp",
        divisionId: "div-comp-a",
        semester: 6,
      });

      // notice-010 is Board of Studies meeting for faculty only
      const facultyOnlyNotice = notices.find((n) => n.id === "notice-010");
      expect(facultyOnlyNotice).toBeUndefined();
    });

    it("13. student must NEVER see DRAFT notices", async () => {
      const { notices } = await NoticeService.getNotices({
        userId: "demo-student-001",
        role: Role.STUDENT,
        departmentId: "dept-comp",
        divisionId: "div-comp-a",
        semester: 6,
      });

      const hasDrafts = notices.some((n) => n.status === NoticeStatus.DRAFT);
      expect(hasDrafts).toBe(false);
    });

    it("14. faculty should see notices targeted to FACULTY and their authored drafts", async () => {
      const { notices } = await NoticeService.getNotices({
        userId: "demo-faculty-001",
        role: Role.FACULTY,
        departmentId: "dept-comp",
      });

      const boardOfStudies = notices.find((n) => n.id === "notice-010");
      expect(boardOfStudies).toBeDefined();

      // notice-011 is Dr. Ramesh Sharma's own draft notice
      const myDraft = notices.find((n) => n.id === "notice-011");
      expect(myDraft).toBeDefined();
      expect(myDraft?.status).toBe(NoticeStatus.DRAFT);
    });

    it("15. admin has institutional visibility across all audiences and drafts", async () => {
      const { notices } = await NoticeService.getNotices({
        userId: "demo-admin-001",
        role: Role.ADMIN,
        includeArchived: true,
      });

      expect(notices.length).toBe(DEMO_NOTICES_STORE.length);
      const hasAllCategories = Object.values(NoticeCategory).every((cat) =>
        notices.some((n) => n.category === cat)
      );
      expect(hasAllCategories).toBe(true);
    });
  });

  // =========================================================================
  // 3. NOTICE LIFECYCLE & STATE TRANSITIONS
  // =========================================================================
  describe("Notice Lifecycle & State Transitions", () => {
    it("16. allows authoring a DRAFT notice and keeps it unindexed from public", async () => {
      const draft = await NoticeService.createNotice(
        {
          id: "demo-faculty-001",
          role: Role.FACULTY,
          firstName: "Dr. Ramesh",
          lastName: "Sharma",
          departmentId: "dept-comp",
        },
        {
          title: "Unit Test New Working Draft",
          summary: "Draft summary notes.",
          content: "Comprehensive draft content not yet approved.",
          category: NoticeCategory.ACADEMIC,
          priority: NoticePriority.NORMAL,
          audience: NoticeAudience.STUDENTS,
          status: NoticeStatus.DRAFT,
        }
      );

      expect(draft.status).toBe(NoticeStatus.DRAFT);
      expect(draft.isPublished).toBe(false);

      // Student cannot see this draft
      const { notices: studentNotices } = await NoticeService.getNotices({
        userId: "demo-student-001",
        role: Role.STUDENT,
        departmentId: "dept-comp",
      });
      expect(studentNotices.some((n) => n.id === draft.id)).toBe(false);
    });

    it("17. transitions DRAFT to PUBLISHED upon authorized publish action", async () => {
      const published = await NoticeService.publishNotice(
        "notice-011",
        "demo-faculty-001",
        Role.FACULTY
      );

      expect(published.status).toBe(NoticeStatus.PUBLISHED);
      expect(published.isPublished).toBe(true);
    });

    it("18. transitions PUBLISHED notice to ARCHIVED", async () => {
      const archived = await NoticeService.archiveNotice(
        "notice-004",
        "demo-faculty-001",
        Role.FACULTY
      );

      expect(archived.status).toBe(NoticeStatus.ARCHIVED);
    });

    it("19. rejects publishing an already ARCHIVED notice", async () => {
      await expect(
        NoticeService.publishNotice("notice-014", "demo-admin-001", Role.ADMIN)
      ).rejects.toThrow("Cannot publish an archived notice");
    });
  });

  // =========================================================================
  // 4. READ / UNREAD TRACKING & IDEMPOTENCY
  // =========================================================================
  describe("Read Tracking & Unread Count", () => {
    it("20. accurately detects unread notice for student", async () => {
      const unread = await NoticeService.getUnreadCount(
        "demo-student-001",
        Role.STUDENT,
        "dept-comp",
        "div-comp-a",
        6
      );
      expect(unread).toBeGreaterThan(0);
    });

    it("21. markAsRead marks notice read and prevents duplicate read records", async () => {
      const noticeId = "notice-002"; // Unread notice
      const ok1 = await NoticeService.markAsRead(noticeId, "demo-student-001");
      expect(ok1).toBe(true);

      const notice = DEMO_NOTICES_STORE.find((n) => n.id === noticeId);
      const studentReadsCount = (notice?.reads || []).filter(
        (r) => r.userId === "demo-student-001"
      ).length;
      expect(studentReadsCount).toBe(1);

      // Idempotency: call again
      const ok2 = await NoticeService.markAsRead(noticeId, "demo-student-001");
      expect(ok2).toBe(true);
      const studentReadsCountAfter = (notice?.reads || []).filter(
        (r) => r.userId === "demo-student-001"
      ).length;
      expect(studentReadsCountAfter).toBe(1);
    });

    it("22. markAsUnread successfully toggles notice back to unread", async () => {
      const noticeId = "notice-001"; // Initially read by demo-student-001
      const ok = await NoticeService.markAsUnread(noticeId, "demo-student-001");
      expect(ok).toBe(true);

      const notice = DEMO_NOTICES_STORE.find((n) => n.id === noticeId);
      const hasRead = (notice?.reads || []).some((r) => r.userId === "demo-student-001");
      expect(hasRead).toBe(false);
    });

    it("23. getNoticeById automatically marks notice as read for recipient", async () => {
      const noticeId = "notice-005"; // Initially unread
      const noticeBefore = DEMO_NOTICES_STORE.find((n) => n.id === noticeId);
      expect(noticeBefore?.reads.some((r) => r.userId === "demo-student-001")).toBe(false);

      const loaded = await NoticeService.getNoticeById(noticeId, {
        userId: "demo-student-001",
        role: Role.STUDENT,
        departmentId: "dept-comp",
        divisionId: "div-comp-a",
        semester: 6,
      });

      expect(loaded.isRead).toBe(true);
      const noticeAfter = DEMO_NOTICES_STORE.find((n) => n.id === noticeId);
      expect(noticeAfter?.reads.some((r) => r.userId === "demo-student-001")).toBe(true);
    });
  });

  // =========================================================================
  // 5. SECURITY BOUNDARIES & RBAC
  // =========================================================================
  describe("Security Boundaries & Server-Side RBAC", () => {
    it("24. strictly blocks STUDENT from creating notices", async () => {
      await expect(
        NoticeService.createNotice(
          {
            id: "demo-student-001",
            role: Role.STUDENT,
            firstName: "Aarav",
            lastName: "Sharma",
          },
          {
            title: "Student Attempted Notice",
            content: "Students should never be permitted to publish campus circulars.",
            category: NoticeCategory.GENERAL,
          }
        )
      ).rejects.toThrow("Students are not permitted to create notices");
    });

    it("25. blocks FACULTY from editing notice authored by another faculty", async () => {
      await expect(
        NoticeService.updateNotice(
          "notice-010", // Authored by Admin
          "demo-faculty-001",
          Role.FACULTY,
          { title: "Unauthorized Edit Attempt" }
        )
      ).rejects.toThrow("Unauthorized: You may only edit notices you authored");
    });

    it("26. blocks unauthorized user from viewing targeted notice details", async () => {
      // notice-015 is targeted exclusively to Mechanical Engineering
      await expect(
        NoticeService.getNoticeById("notice-015", {
          userId: "demo-student-001",
          role: Role.STUDENT,
          departmentId: "dept-comp", // Computer Eng student
        })
      ).rejects.toThrow("Unauthorized: You do not have permission to view this notice");
    });

    it("27. blocks faculty from targeting exclusively administrative audience", async () => {
      await expect(
        NoticeService.createNotice(
          {
            id: "demo-faculty-001",
            role: Role.FACULTY,
            firstName: "Dr. Ramesh",
            lastName: "Sharma",
          },
          {
            title: "Faculty Targeting Admin Notice",
            content: "Faculty attempting to broadcast to ADMIN only.",
            category: NoticeCategory.ADMINISTRATIVE,
            audience: NoticeAudience.ADMIN,
          }
        )
      ).rejects.toThrow("Faculty cannot target exclusively Administrative audience");
    });
  });

  // =========================================================================
  // 6. ANALYTICS & REACH METRICS
  // =========================================================================
  describe("Notice Analytics & Reach Calculation", () => {
    it("28. computes institutional analytics with positive reach and confirmed read rates", async () => {
      const analytics = await NoticeService.getNoticeAnalytics("demo-admin-001", Role.ADMIN);

      expect(analytics.metrics.totalNotices).toBeGreaterThanOrEqual(15);
      expect(analytics.metrics.published).toBeGreaterThan(0);
      expect(analytics.metrics.drafts).toBeGreaterThan(0);
      expect(analytics.metrics.totalReach).toBeGreaterThan(0);
      expect(analytics.metrics.averageReadRate).toBeGreaterThan(0);
      expect(analytics.categoryBreakdown.length).toBeGreaterThanOrEqual(8);
    });

    it("29. calculates realistic per-notice reach statistics", () => {
      const notice = DEMO_NOTICES_STORE.find((n) => n.id === "notice-001");
      expect(notice).toBeDefined();
      if (notice) {
        const stats = NoticeService.calculateReach(notice);
        expect(stats.totalRecipients).toBe(850);
        expect(stats.readCount).toBeGreaterThan(0);
        expect(stats.readPercentage).toBeGreaterThanOrEqual(70);
      }
    });
  });
});
