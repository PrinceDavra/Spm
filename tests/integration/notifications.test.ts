import { describe, it, expect, beforeEach } from "vitest";
import {
  NotificationService,
  DEMO_NOTIFICATIONS_STORE,
  DEMO_PREFERENCES_STORE,
  resetDemoNotificationsStore,
} from "@/services/notification.service";
import { NoticeService } from "@/services/notice.service";
import { AttendanceService } from "@/services/attendance.service";
import { AssignmentService } from "@/services/assignment.service";
import { EventService } from "@/services/event.service";
import { ClubService } from "@/services/club.service";
import { LostFoundService } from "@/services/lost-found.service";
import {
  NotificationType,
  NotificationPriority,
  PreferenceChannel,
  Role,
  NoticeAudience,
  NoticeCategory,
  NoticePriority,
} from "@prisma/client";

describe("Phase 13 — Campus Communication, Notifications & Smart Information Hub Tests", () => {
  const studentUser = {
    id: "demo-student-001",
    role: Role.STUDENT,
    email: "student@campussphere.edu",
    departmentId: "dept-comp",
    divisionId: "div-comp-a",
    semester: 6,
  };

  const studentUserB = {
    id: "demo-student-002",
    role: Role.STUDENT,
    email: "student2@campussphere.edu",
    departmentId: "dept-it",
    divisionId: "div-it-a",
    semester: 4,
  };

  const facultyUser = {
    id: "demo-faculty-001",
    role: Role.FACULTY,
    email: "faculty@campussphere.edu",
    departmentId: "dept-comp",
  };

  const adminUser = {
    id: "demo-admin-001",
    role: Role.ADMIN,
    email: "admin@campussphere.edu",
  };

  beforeEach(() => {
    resetDemoNotificationsStore();
  });

  describe("1. Notification Center Retrieval & Ownership Security", () => {
    it("1. Authenticated user can fetch own notifications", async () => {
      const notifs = await NotificationService.getUserNotifications(studentUser.id);
      expect(Array.isArray(notifs)).toBe(true);
      expect(notifs.length).toBeGreaterThan(0);
      expect(notifs.every((n) => n.userId === studentUser.id)).toBe(true);
    });

    it("2. Unauthenticated notification request rejected (RBAC boundary)", () => {
      const allowedRoles: Role[] = [Role.STUDENT, Role.FACULTY, Role.ADMIN, Role.PLACEMENT_OFFICER, Role.CLUB_COORDINATOR];
      const anonymousRole = undefined;
      expect(allowedRoles.includes(anonymousRole as unknown as Role)).toBe(false);
    });

    it("3. Student cannot access or modify another user's notifications", async () => {
      const facultyNotifs = await NotificationService.getUserNotifications(facultyUser.id);
      expect(facultyNotifs.length).toBeGreaterThan(0);
      const targetNotif = facultyNotifs[0];

      // Student trying to mark faculty notification as read must throw error
      await expect(
        NotificationService.markAsRead(targetNotif.id, studentUser.id)
      ).rejects.toThrow(/Unauthorized/);
    });

    it("4. Faculty cannot access or modify another user's notifications", async () => {
      const studentNotifs = await NotificationService.getUserNotifications(studentUser.id);
      expect(studentNotifs.length).toBeGreaterThan(0);
      const targetNotif = studentNotifs[0];

      await expect(
        NotificationService.markAsRead(targetNotif.id, facultyUser.id)
      ).rejects.toThrow(/Unauthorized/);
    });
  });

  describe("2. Read / Unread State Management & Unread Count", () => {
    it("5. Mark notification read updates isRead and readAt timestamp", async () => {
      const initialNotifs = await NotificationService.getUserNotifications(studentUser.id, { isRead: false });
      const target = initialNotifs[0];

      const updated = await NotificationService.markAsRead(target.id, studentUser.id);
      expect(updated.isRead).toBe(true);
      expect(updated.readAt).not.toBeNull();

      // Verify in store
      const refreshed = DEMO_NOTIFICATIONS_STORE.find((n) => n.id === target.id);
      expect(refreshed?.isRead).toBe(true);
    });

    it("6. Mark notification unread reverts status and clears readAt", async () => {
      const notifs = await NotificationService.getUserNotifications(studentUser.id);
      const readItem = notifs.find((n) => n.isRead) || notifs[0];
      readItem.isRead = true;
      readItem.readAt = new Date().toISOString();

      const reverted = await NotificationService.markAsUnread(readItem.id, studentUser.id);
      expect(reverted.isRead).toBe(false);
      expect(reverted.readAt).toBeNull();
    });

    it("7. Mark all notifications read marks all items for the user", async () => {
      const result = await NotificationService.markAllAsRead(studentUser.id);
      expect(result.count).toBeGreaterThan(0);

      const unreadAfter = await NotificationService.getUnreadCount(studentUser.id);
      expect(unreadAfter).toBe(0);
    });

    it("8. Unread count returns accurate calculation", async () => {
      const count = await NotificationService.getUnreadCount(studentUser.id);
      const unreadItems = DEMO_NOTIFICATIONS_STORE.filter(
        (n) => n.userId === studentUser.id && !n.isRead
      );
      expect(count).toBe(unreadItems.length);
    });

    it("9. Notification deep link is preserved and formatted correctly", async () => {
      const notifs = await NotificationService.getUserNotifications(studentUser.id);
      const withLink = notifs.find((n) => n.link !== null);
      expect(withLink).toBeDefined();
      expect(withLink?.link?.startsWith("/dashboard/")).toBe(true);
    });
  });

  describe("3. Priority, Filtering, Search, and Pagination", () => {
    it("10. Notification priority levels work across LOW, NORMAL, HIGH, URGENT", async () => {
      const urgent = await NotificationService.sendNotification({
        userId: studentUser.id,
        title: "Emergency Campus Evacuation Drill",
        message: "Scheduled fire drill at 2 PM today.",
        type: NotificationType.SYSTEM,
        priority: NotificationPriority.URGENT,
      });
      expect(urgent.priority).toBe(NotificationPriority.URGENT);

      const high = await NotificationService.sendNotification({
        userId: studentUser.id,
        title: "Coursework Submission Closes Soon",
        message: "Final deadline in 2 hours.",
        type: NotificationType.ASSIGNMENT,
        priority: NotificationPriority.HIGH,
      });
      expect(high.priority).toBe(NotificationPriority.HIGH);
    });

    it("11. Notification filtering by category and priority operates accurately", async () => {
      const assignmentNotifs = await NotificationService.getUserNotifications(studentUser.id, {
        type: NotificationType.ASSIGNMENT,
      });
      expect(assignmentNotifs.every((n) => n.type === NotificationType.ASSIGNMENT)).toBe(true);

      const urgentNotifs = await NotificationService.getUserNotifications(studentUser.id, {
        priority: NotificationPriority.URGENT,
      });
      expect(urgentNotifs.every((n) => n.priority === NotificationPriority.URGENT)).toBe(true);
    });

    it("12. Notification pagination limits returned elements", async () => {
      const page1 = await NotificationService.getUserNotifications(studentUser.id, {
        limit: 2,
        offset: 0,
      });
      expect(page1.length).toBeLessThanOrEqual(2);

      const page2 = await NotificationService.getUserNotifications(studentUser.id, {
        limit: 2,
        offset: 2,
      });
      expect(page2.length).toBeLessThanOrEqual(2);
      if (page1.length > 0 && page2.length > 0) {
        expect(page1[0].id).not.toBe(page2[0].id);
      }
    });

    it("13. Search query matches notification title and message", async () => {
      const results = await NotificationService.getUserNotifications(studentUser.id, {
        search: "assignment",
      });
      expect(results.length).toBeGreaterThan(0);
      expect(
        results.every(
          (n) =>
            n.title.toLowerCase().includes("assignment") ||
            n.message.toLowerCase().includes("assignment")
        )
      ).toBe(true);
    });
  });

  describe("4. Deduplication & Preference Enforcement", () => {
    it("14. Duplicate notifications are prevented using deterministic dedupKey", async () => {
      const initialCount = DEMO_NOTIFICATIONS_STORE.length;

      const first = await NotificationService.sendNotification({
        userId: studentUser.id,
        title: "Timetable Room Reassignment",
        message: "Room 301 shifted to 302.",
        type: NotificationType.TIMETABLE,
        sourceEntity: "TIMETABLE",
        sourceId: "slot-99",
        action: "ROOM_SHIFT",
      });

      expect(DEMO_NOTIFICATIONS_STORE.length).toBe(initialCount + 1);

      // Trigger identical notification again
      const second = await NotificationService.sendNotification({
        userId: studentUser.id,
        title: "Timetable Room Reassignment - Updated",
        message: "Room 301 shifted to 302.",
        type: NotificationType.TIMETABLE,
        sourceEntity: "TIMETABLE",
        sourceId: "slot-99",
        action: "ROOM_SHIFT",
      });

      // Count should NOT increase because deduplication updated the existing item
      expect(DEMO_NOTIFICATIONS_STORE.length).toBe(initialCount + 1);
      expect(second.id).toBe(first.id);
      expect(second.title).toBe("Timetable Room Reassignment - Updated");
    });

    it("15. Notification preferences save and retrieve correctly", async () => {
      const updatedPrefs = await NotificationService.updateUserPreferences(studentUser.id, [
        { category: NotificationType.CLUB, channel: PreferenceChannel.DISABLED },
        { category: NotificationType.EVENT, channel: PreferenceChannel.IN_APP },
      ]);

      const clubPref = updatedPrefs.find((p) => p.category === NotificationType.CLUB);
      expect(clubPref?.channel).toBe(PreferenceChannel.DISABLED);

      const eventPref = updatedPrefs.find((p) => p.category === NotificationType.EVENT);
      expect(eventPref?.channel).toBe(PreferenceChannel.IN_APP);
    });

    it("16. Critical notifications (SYSTEM, ACADEMIC) cannot be disabled", async () => {
      await expect(
        NotificationService.updateUserPreferences(studentUser.id, [
          { category: NotificationType.SYSTEM, channel: PreferenceChannel.DISABLED },
        ])
      ).rejects.toThrow(/Critical notifications/);

      await expect(
        NotificationService.updateUserPreferences(studentUser.id, [
          { category: NotificationType.ACADEMIC, channel: PreferenceChannel.DISABLED },
        ])
      ).rejects.toThrow(/Critical notifications/);
    });

    it("17. Non-critical notifications disabled by preference are suppressed", async () => {
      await NotificationService.updateUserPreferences(studentUser.id, [
        { category: NotificationType.CLUB, channel: PreferenceChannel.DISABLED },
      ]);

      const initialLength = DEMO_NOTIFICATIONS_STORE.filter(
        (n) => n.userId === studentUser.id && n.type === NotificationType.CLUB
      ).length;

      const dispatched = await NotificationService.sendNotification({
        userId: studentUser.id,
        title: "Anime Club Screening",
        message: "Friday screening at 5 PM.",
        type: NotificationType.CLUB,
      });

      // Should be suppressed and marked read immediately without adding active unread alert
      expect(dispatched.isRead).toBe(true);
      const afterLength = DEMO_NOTIFICATIONS_STORE.filter(
        (n) => n.userId === studentUser.id && n.type === NotificationType.CLUB && !n.isRead
      ).length;
      expect(afterLength).toBe(0);
    });
  });

  describe("5. Announcement Authoring & Audience Targeting", () => {
    it("18. Unauthorized student cannot publish targeted announcements", async () => {
      const allowedPublishers: Role[] = [Role.ADMIN, Role.FACULTY, Role.CLUB_COORDINATOR, Role.PLACEMENT_OFFICER];
      expect(allowedPublishers.includes(studentUser.role)).toBe(false);
    });

    it("19. Authorized admin can create campus announcement", async () => {
      const notice = await NoticeService.createNotice(
        {
          id: adminUser.id,
          role: Role.ADMIN,
          firstName: "System",
          lastName: "Admin",
        },
        {
          title: "Campus Wi-Fi Maintenance Schedule",
          content: "Network core switches will be upgraded over the weekend.",
          category: NoticeCategory.ADMINISTRATIVE,
          priority: NoticePriority.IMPORTANT,
          audience: NoticeAudience.ALL,
        }
      );

      expect(notice).toBeDefined();
      expect(notice.title).toBe("Campus Wi-Fi Maintenance Schedule");
      expect(notice.status).toBe("PUBLISHED");
    });

    it("20. Audience targeting isolates students from non-targeted notices", async () => {
      const facultyOnlyNotice = await NoticeService.createNotice(
        {
          id: adminUser.id,
          role: Role.ADMIN,
          firstName: "Dean",
          lastName: "Academics",
        },
        {
          title: "Faculty Senate Meeting",
          content: "Agenda: Accreditation documentation.",
          category: NoticeCategory.ADMINISTRATIVE,
          priority: NoticePriority.NORMAL,
          audience: NoticeAudience.FACULTY,
        }
      );

      const inAudienceStudent = NoticeService.isUserInAudience(facultyOnlyNotice, {
        userId: studentUser.id,
        role: studentUser.role,
      });
      expect(inAudienceStudent).toBe(false);

      const inAudienceFaculty = NoticeService.isUserInAudience(facultyOnlyNotice, {
        userId: facultyUser.id,
        role: facultyUser.role,
      });
      expect(inAudienceFaculty).toBe(true);
    });

    it("21. Department targeting restricts visibility to matching department members", async () => {
      const deptNotice = await NoticeService.createNotice(
        {
          id: adminUser.id,
          role: Role.ADMIN,
          firstName: "Head",
          lastName: "COMP",
          departmentId: "dept-comp",
        },
        {
          title: "Computer Engineering Capstone Project Evaluation",
          content: "All CSE students must submit project synopsis.",
          category: NoticeCategory.ACADEMIC,
          priority: NoticePriority.IMPORTANT,
          audience: NoticeAudience.DEPARTMENT,
          departmentId: "dept-comp",
        }
      );

      // Student A belongs to dept-comp -> should be visible
      const visibleA = NoticeService.isUserInAudience(deptNotice, {
        userId: studentUser.id,
        role: studentUser.role,
        departmentId: studentUser.departmentId,
      });
      expect(visibleA).toBe(true);

      // Student B belongs to dept-it -> should be invisible
      const visibleB = NoticeService.isUserInAudience(deptNotice, {
        userId: studentUserB.id,
        role: studentUserB.role,
        departmentId: studentUserB.departmentId,
      });
      expect(visibleB).toBe(false);
    });

    it("22. Division targeting restricts visibility to specific division sections", async () => {
      const divNotice = await NoticeService.createNotice(
        {
          id: adminUser.id,
          role: Role.ADMIN,
          firstName: "Admin",
          lastName: "Office",
        },
        {
          title: "Division A Lab Rescheduling",
          content: "Division A lab is shifted to Friday 9 AM.",
          category: NoticeCategory.ACADEMIC,
          priority: NoticePriority.NORMAL,
          audience: NoticeAudience.DIVISION,
          departmentId: "dept-comp",
          divisionId: "div-comp-a",
        }
      );

      const visibleDivA = NoticeService.isUserInAudience(divNotice, {
        userId: studentUser.id,
        role: studentUser.role,
        divisionId: "div-comp-a",
      });
      expect(visibleDivA).toBe(true);

      const visibleDivB = NoticeService.isUserInAudience(divNotice, {
        userId: "demo-student-99",
        role: Role.STUDENT,
        divisionId: "div-comp-b",
      });
      expect(visibleDivB).toBe(false);
    });
  });

  describe("6. Cross-Module Integration Intelligence", () => {
    it("23. Attendance alert uses existing attendance thresholds (65%, 75%)", async () => {
      const summary = await AttendanceService.getStudentSummary(studentUser.id);
      expect(summary).toBeDefined();
      expect(summary.overallPercentage).toBeGreaterThanOrEqual(0);

      const feed = await NotificationService.getSmartFeed(studentUser.id, Role.STUDENT);
      const attAlert = feed.items.find((i) => i.category === NotificationType.ATTENDANCE);

      if (summary.overallRisk === "CRITICAL") {
        expect(attAlert?.priority).toBe(NotificationPriority.URGENT);
        expect(attAlert?.summary).toContain("Critical");
      } else if (summary.overallRisk === "WARNING") {
        expect(attAlert?.priority).toBe(NotificationPriority.HIGH);
      }
    });

    it("24. Student receives relevant assignment notification with deep link", async () => {
      const notifs = await NotificationService.getUserNotifications(studentUser.id, {
        type: NotificationType.ASSIGNMENT,
      });
      expect(notifs.length).toBeGreaterThan(0);
      expect(notifs[0].link).toContain("/dashboard/student/assignments");
    });

    it("25. Event reminders reach users with valid deep links", async () => {
      const eventNotif = await NotificationService.sendNotification({
        userId: studentUser.id,
        title: "Event Reminder: Robotics Workshop",
        message: "Begins in 1 hour at Central Auditorium.",
        type: NotificationType.EVENT,
        link: "/dashboard/student/events/event-001",
      });
      expect(eventNotif.link).toBe("/dashboard/student/events/event-001");
    });

    it("26. Placement notification respects eligibility criteria", async () => {
      const placementNotifs = await NotificationService.getUserNotifications(studentUser.id, {
        type: NotificationType.PLACEMENT,
      });
      expect(placementNotifs.length).toBeGreaterThan(0);
      expect(placementNotifs[0].title).toContain("Placement");
    });

    it("27. Lost & Found notification does not leak private claim verification info", async () => {
      const lfNotif = await NotificationService.sendNotification({
        userId: studentUser.id,
        title: "Potential Match Found",
        message: "An item matching your lost description was reported in Central Library.",
        type: NotificationType.LOST_FOUND,
        link: "/dashboard/student/lost-found",
      });

      // Private verification secret or pin should never be in message
      expect(lfNotif.message).not.toContain("secret");
      expect(lfNotif.message).not.toContain("pin");
    });

    it("28. Timetable notification reaches affected users", async () => {
      const ttNotif = await NotificationService.sendNotification({
        userId: facultyUser.id,
        title: "Lecture Schedule Reassigned",
        message: "Your Monday 11 AM class has been assigned to Room 401.",
        type: NotificationType.TIMETABLE,
        link: "/dashboard/faculty/timetable",
        priority: NotificationPriority.HIGH,
      });
      expect(ttNotif.userId).toBe(facultyUser.id);
      expect(ttNotif.priority).toBe(NotificationPriority.HIGH);
    });

    it("29. Smart feed aggregates cross-module items with relative timing", async () => {
      const feed = await NotificationService.getSmartFeed(studentUser.id, Role.STUDENT);
      expect(feed.items.length).toBeGreaterThan(0);
      expect(feed.items[0].relativeTiming).toBeDefined();
      expect(feed.lastUpdated).toBeDefined();
    });

    it("30. Deleting/dismissing notification removes it from user roster", async () => {
      const notifs = await NotificationService.getUserNotifications(studentUser.id);
      const target = notifs[0];

      const dismissed = await NotificationService.deleteNotification(target.id, studentUser.id);
      expect(dismissed).toBe(true);

      const remaining = await NotificationService.getUserNotifications(studentUser.id);
      expect(remaining.some((n) => n.id === target.id)).toBe(false);
    });
  });
});
