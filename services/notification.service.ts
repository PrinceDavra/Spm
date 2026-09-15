import { prisma } from "@/lib/prisma";
import { isDatabaseOnline } from "@/lib/db-health";
import { NotificationType, NotificationPriority, PreferenceChannel, Role } from "@prisma/client";
import {
  DemoNotification,
  DEMO_NOTIFICATIONS_STORE,
  DEMO_PREFERENCES_STORE,
  resetDemoNotificationsStore,
} from "@/lib/notification/demo-notifications";
import { AttendanceService } from "@/services/attendance.service";
import { AssignmentService } from "@/services/assignment.service";
import { NoticeService } from "@/services/notice.service";
import { EventService } from "@/services/event.service";
import { PlacementService } from "@/services/placement.service";
import { ClubService } from "@/services/club.service";

export type SystemNotification = DemoNotification;
export { DEMO_NOTIFICATIONS_STORE, DEMO_PREFERENCES_STORE, resetDemoNotificationsStore };

export interface SendNotificationOptions {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  link?: string | null;
  sourceEntity?: string | null;
  sourceId?: string | null;
  action?: string | null;
  groupKey?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface SmartFeedItem {
  id: string;
  title: string;
  summary: string;
  category: NotificationType;
  priority: NotificationPriority;
  timestamp: string;
  relativeTiming?: string;
  deepLink: string;
  sourceEntity: string;
  badgeText?: string;
  actionText?: string;
  isUrgent?: boolean;
}

export class NotificationService {
  /**
   * Log an audit trail entry for important communication/notification actions.
   */
  private static async logAudit(
    userId: string,
    action: string,
    entity: string,
    entityId: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    try {
      if (await isDatabaseOnline()) {
        await prisma.auditLog.create({
          data: {
            userId,
            action,
            entity,
            entityId,
            details: details ? JSON.stringify(details) : undefined,
          },
        });
      }
    } catch {
      // Non-blocking fallback in demo mode
    }
  }

  /**
   * Dispatch a notification to a specific user with deduplication and preference check.
   */
  static async sendNotification({
    userId,
    title,
    message,
    type = NotificationType.SYSTEM,
    priority = NotificationPriority.NORMAL,
    link,
    sourceEntity,
    sourceId,
    action,
    groupKey,
    metadata,
  }: SendNotificationOptions): Promise<SystemNotification> {
    // 1. Preference check
    // Critical categories (SYSTEM, ACADEMIC) or URGENT priorities cannot be suppressed.
    const userPref = DEMO_PREFERENCES_STORE.find(
      (p) => p.userId === userId && p.category === type
    );
    const isCritical =
      type === NotificationType.SYSTEM ||
      type === NotificationType.ACADEMIC ||
      priority === NotificationPriority.URGENT;

    if (userPref && userPref.channel === PreferenceChannel.DISABLED && !isCritical) {
      // Soft-suppressed by user preference
      const suppressedItem: SystemNotification = {
        id: `suppressed-${Date.now()}`,
        userId,
        title,
        message,
        type,
        priority,
        link: link || null,
        isRead: true,
        readAt: new Date().toISOString(),
        sourceEntity: sourceEntity || null,
        sourceId: sourceId || null,
        dedupKey: null,
        groupKey: groupKey || null,
        metadata: metadata || null,
        createdAt: new Date().toISOString(),
      };
      return suppressedItem;
    }

    // 2. Compute deterministic deduplication key
    const computedDedupKey = `${userId}:${type}:${sourceEntity || "GEN"}:${sourceId || "GEN"}:${action || "ALERT"}`;

    // Check for recent unread duplicate (e.g. within same day)
    const existingIndex = DEMO_NOTIFICATIONS_STORE.findIndex(
      (n) => n.userId === userId && n.dedupKey === computedDedupKey && !n.isRead
    );

    if (existingIndex !== -1) {
      // Update existing item's timestamp and message instead of adding redundant spam
      const existing = DEMO_NOTIFICATIONS_STORE[existingIndex];
      existing.title = title;
      existing.message = message;
      existing.priority = priority;
      existing.createdAt = new Date().toISOString();
      return existing;
    }

    // 3. Create fresh notification
    const memoryNotification: SystemNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      title,
      message,
      type,
      priority,
      link: link || null,
      isRead: false,
      readAt: null,
      sourceEntity: sourceEntity || null,
      sourceId: sourceId || null,
      dedupKey: computedDedupKey,
      groupKey: groupKey || null,
      metadata: metadata || null,
      createdAt: new Date().toISOString(),
    };

    DEMO_NOTIFICATIONS_STORE.unshift(memoryNotification);

    try {
      if (await isDatabaseOnline()) {
        await prisma.notification.create({
          data: {
            userId,
            title,
            message,
            type,
            priority,
            link: link || null,
            sourceEntity: sourceEntity || null,
            sourceId: sourceId || null,
            dedupKey: computedDedupKey,
            groupKey: groupKey || null,
          },
        });
      }
    } catch (err) {
      console.warn("Could not persist notification to database:", err);
    }

    return memoryNotification;
  }

  /**
   * Dispatch notifications in bulk to multiple users.
   */
  static async sendBulkNotification({
    userIds,
    title,
    message,
    type = NotificationType.ASSIGNMENT,
    priority = NotificationPriority.NORMAL,
    link,
    sourceEntity,
    sourceId,
    action,
    groupKey,
    metadata,
  }: {
    userIds: string[];
    title: string;
    message: string;
    type?: NotificationType;
    priority?: NotificationPriority;
    link?: string;
    sourceEntity?: string;
    sourceId?: string;
    action?: string;
    groupKey?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    for (const userId of userIds) {
      await this.sendNotification({
        userId,
        title,
        message,
        type,
        priority,
        link,
        sourceEntity,
        sourceId,
        action,
        groupKey,
        metadata,
      });
    }
  }

  /**
   * Get notifications for a user with rich filtering, search, and pagination.
   */
  static async getUserNotifications(
    userId: string,
    filters?: {
      type?: NotificationType;
      priority?: NotificationPriority;
      isRead?: boolean;
      search?: string;
      limit?: number;
      offset?: number;
      groupKey?: string;
    }
  ): Promise<SystemNotification[]> {
    let list = DEMO_NOTIFICATIONS_STORE.filter((n) => n.userId === userId);

    if (filters?.type) {
      list = list.filter((n) => n.type === filters.type);
    }
    if (filters?.priority) {
      list = list.filter((n) => n.priority === filters.priority);
    }
    if (filters?.isRead !== undefined) {
      list = list.filter((n) => n.isRead === filters.isRead);
    }
    if (filters?.groupKey) {
      list = list.filter((n) => n.groupKey === filters.groupKey);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (n) => n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q)
      );
    }

    // Sort by createdAt descending
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (filters?.offset !== undefined && filters?.limit !== undefined) {
      return list.slice(filters.offset, filters.offset + filters.limit);
    }
    if (filters?.limit) {
      return list.slice(0, filters.limit);
    }

    return list;
  }

  /**
   * Get fast count of unread notifications for a user.
   */
  static async getUnreadCount(userId: string): Promise<number> {
    return DEMO_NOTIFICATIONS_STORE.filter((n) => n.userId === userId && !n.isRead).length;
  }

  /**
   * Mark a single notification as read (with ownership verification).
   */
  static async markAsRead(notificationId: string, userId: string): Promise<SystemNotification> {
    const notif = DEMO_NOTIFICATIONS_STORE.find((n) => n.id === notificationId);
    if (!notif) {
      throw new Error("Notification not found");
    }
    if (notif.userId !== userId) {
      throw new Error("Unauthorized to modify this notification");
    }

    notif.isRead = true;
    notif.readAt = new Date().toISOString();

    try {
      if (await isDatabaseOnline()) {
        await prisma.notification.updateMany({
          where: { id: notificationId, userId },
          data: { isRead: true, readAt: new Date() },
        });
      }
    } catch {
      // Offline fallback
    }

    return notif;
  }

  /**
   * Mark a single notification as unread (with ownership verification).
   */
  static async markAsUnread(notificationId: string, userId: string): Promise<SystemNotification> {
    const notif = DEMO_NOTIFICATIONS_STORE.find((n) => n.id === notificationId);
    if (!notif) {
      throw new Error("Notification not found");
    }
    if (notif.userId !== userId) {
      throw new Error("Unauthorized to modify this notification");
    }

    notif.isRead = false;
    notif.readAt = null;

    try {
      if (await isDatabaseOnline()) {
        await prisma.notification.updateMany({
          where: { id: notificationId, userId },
          data: { isRead: false, readAt: null },
        });
      }
    } catch {
      // Offline fallback
    }

    return notif;
  }

  /**
   * Bulk mark all notifications as read for a user.
   */
  static async markAllAsRead(userId: string, ids?: string[]): Promise<{ count: number }> {
    let count = 0;
    const now = new Date().toISOString();

    DEMO_NOTIFICATIONS_STORE.forEach((n) => {
      if (n.userId === userId && !n.isRead) {
        if (!ids || ids.includes(n.id)) {
          n.isRead = true;
          n.readAt = now;
          count++;
        }
      }
    });

    try {
      if (await isDatabaseOnline()) {
        await prisma.notification.updateMany({
          where: {
            userId,
            isRead: false,
            ...(ids && ids.length > 0 ? { id: { in: ids } } : {}),
          },
          data: { isRead: true, readAt: new Date() },
        });
      }
    } catch {
      // Offline fallback
    }

    return { count };
  }

  /**
   * Delete / dismiss a notification for a user.
   */
  static async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    const index = DEMO_NOTIFICATIONS_STORE.findIndex(
      (n) => n.id === notificationId && n.userId === userId
    );
    if (index === -1) {
      throw new Error("Notification not found or unauthorized");
    }

    DEMO_NOTIFICATIONS_STORE.splice(index, 1);

    try {
      if (await isDatabaseOnline()) {
        await prisma.notification.deleteMany({
          where: { id: notificationId, userId },
        });
      }
    } catch {
      // Offline fallback
    }

    return true;
  }

  /**
   * Get user notification preferences across all notification categories.
   */
  static async getUserPreferences(userId: string): Promise<
    Array<{ category: NotificationType; channel: PreferenceChannel }>
  > {
    const allCategories = Object.values(NotificationType);
    const existing = DEMO_PREFERENCES_STORE.filter((p) => p.userId === userId);

    return allCategories.map((cat) => {
      const found = existing.find((p) => p.category === cat);
      return {
        category: cat,
        channel: found ? found.channel : PreferenceChannel.IN_APP,
      };
    });
  }

  /**
   * Update notification preferences for a user.
   */
  static async updateUserPreferences(
    userId: string,
    updates: Array<{ category: NotificationType; channel: PreferenceChannel }>
  ): Promise<Array<{ category: NotificationType; channel: PreferenceChannel }>> {
    const now = new Date().toISOString();

    for (const item of updates) {
      // Critical check: SYSTEM and ACADEMIC notifications cannot be disabled
      if (
        (item.category === NotificationType.SYSTEM || item.category === NotificationType.ACADEMIC) &&
        item.channel === PreferenceChannel.DISABLED
      ) {
        throw new Error(`Critical notifications for '${item.category}' cannot be disabled`);
      }

      const existingIndex = DEMO_PREFERENCES_STORE.findIndex(
        (p) => p.userId === userId && p.category === item.category
      );

      if (existingIndex !== -1) {
        DEMO_PREFERENCES_STORE[existingIndex].channel = item.channel;
        DEMO_PREFERENCES_STORE[existingIndex].updatedAt = now;
      } else {
        DEMO_PREFERENCES_STORE.push({
          id: `pref-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          userId,
          category: item.category,
          channel: item.channel,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    await this.logAudit(userId, "PREFERENCES_UPDATED", "NotificationPreference", userId, {
      updatedCategories: updates.map((u) => u.category),
    });

    return this.getUserPreferences(userId);
  }

  /**
   * Smart Campus Information Feed:
   * Consolidates real-time information across modules based on role and academic targeting.
   */
  static async getSmartFeed(
    userId: string,
    role: Role,
    context?: {
      departmentId?: string;
      divisionId?: string;
      semester?: number;
    }
  ): Promise<{
    items: SmartFeedItem[];
    deadlinesCount: number;
    urgentCount: number;
    lastUpdated: string;
  }> {
    const feedItems: SmartFeedItem[] = [];

    // 1. Check Attendance Risk for Students
    if (role === Role.STUDENT) {
      try {
        const attendanceSummary = await AttendanceService.getStudentSummary(userId);
        if (attendanceSummary.overallRisk === "CRITICAL" || attendanceSummary.overallRisk === "WARNING") {
          feedItems.push({
            id: `feed-att-${userId}`,
            title: `Attendance Alert: ${attendanceSummary.overallPercentage.toFixed(1)}% Overall`,
            summary:
              attendanceSummary.overallRisk === "CRITICAL"
                ? `Critical debarment risk! Attendance is below 65%. View recommended projections.`
                : `Warning: Attendance is below the safe 75% threshold. Avoid unexcused absences.`,
            category: NotificationType.ATTENDANCE,
            priority:
              attendanceSummary.overallRisk === "CRITICAL"
                ? NotificationPriority.URGENT
                : NotificationPriority.HIGH,
            timestamp: new Date().toISOString(),
            relativeTiming: "Action required immediately",
            deepLink: "/dashboard/student/attendance",
            sourceEntity: "ATTENDANCE",
            badgeText: `${attendanceSummary.overallPercentage.toFixed(0)}%`,
            actionText: "Inspect Projections",
            isUrgent: attendanceSummary.overallRisk === "CRITICAL",
          });
        }
      } catch {
        // Fallback gracefully
      }
    }

    // 2. Check Upcoming Assignments
    if (role === Role.STUDENT) {
      try {
        const asgnData = await AssignmentService.getStudentAssignments(userId);
        const pending = asgnData.assignments.filter(
          (a) => a.submissionStatus === "NOT_SUBMITTED" || a.submissionStatus === "OVERDUE"
        );

        pending.slice(0, 3).forEach((asgn) => {
          const dueDate = new Date(asgn.dueDate);
          const now = new Date();
          const diffHours = Math.round((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60));

          let timing = "Upcoming";
          if (diffHours < 0) timing = "Overdue";
          else if (diffHours <= 24) timing = "Due in 24 hours";
          else if (diffHours <= 48) timing = "Due tomorrow";
          else timing = `${Math.ceil(diffHours / 24)} days remaining`;

          feedItems.push({
            id: `feed-asgn-${asgn.id}`,
            title: `Assignment Due: ${asgn.title}`,
            summary: `${asgn.subjectName} • ${asgn.maxMarks} marks. Submit before deadline.`,
            category: NotificationType.ASSIGNMENT,
            priority: diffHours <= 24 ? NotificationPriority.HIGH : NotificationPriority.NORMAL,
            timestamp: asgn.dueDate,
            relativeTiming: timing,
            deepLink: `/dashboard/student/assignments/${asgn.id}`,
            sourceEntity: "ASSIGNMENT",
            badgeText: asgn.subjectCode,
            actionText: "Submit Assignment",
            isUrgent: diffHours <= 24 && diffHours >= 0,
          });
        });
      } catch {
        // Fallback gracefully
      }
    }

    // 3. Check Campus Notices
    try {
      const { notices } = await NoticeService.getNotices({
        userId,
        role,
        departmentId: context?.departmentId || "dept-comp",
        divisionId: context?.divisionId || "div-comp-a",
        semester: context?.semester || 6,
        limit: 4,
      });

      notices.forEach((notice) => {
        feedItems.push({
          id: `feed-notice-${notice.id}`,
          title: notice.title,
          summary: notice.summary || notice.content.substring(0, 120) + "...",
          category: NotificationType.NOTICE,
          priority:
            notice.priority === "URGENT"
              ? NotificationPriority.URGENT
              : notice.priority === "IMPORTANT"
              ? NotificationPriority.HIGH
              : NotificationPriority.NORMAL,
          timestamp: notice.publishDate || notice.createdAt,
          relativeTiming: "Campus Circular",
          deepLink:
            role === Role.STUDENT
              ? `/dashboard/student/notices/${notice.id}`
              : role === Role.FACULTY
              ? `/dashboard/faculty/notices/${notice.id}`
              : `/dashboard/admin/notices`,
          sourceEntity: "NOTICE",
          badgeText: notice.category,
          actionText: "Read Circular",
          isUrgent: notice.priority === "URGENT",
        });
      });
    } catch {
      // Fallback gracefully
    }

    // 4. Check Upcoming Events
    try {
      const { events } = await EventService.getEvents({
        userId,
        role,
        tab: "upcoming",
        limit: 3,
      });

      events.forEach((ev) => {
        feedItems.push({
          id: `feed-ev-${ev.id}`,
          title: `Campus Event: ${ev.title}`,
          summary: `${ev.venue} • ${ev.summary || "Join campus community members"}`,
          category: NotificationType.EVENT,
          priority: NotificationPriority.NORMAL,
          timestamp: ev.startDateTime,
          relativeTiming: "Upcoming Event",
          deepLink: `/dashboard/student/events/${ev.id}`,
          sourceEntity: "EVENT",
          badgeText: ev.category,
          actionText: "View Event",
        });
      });
    } catch {
      // Fallback gracefully
    }

    // 5. Check Active Placement Drives for Students
    if (role === Role.STUDENT) {
      try {
        const drivesData = await PlacementService.getDrives({
          userId,
          role,
          status: "PUBLISHED",
          limit: 3,
        });

        drivesData.drives.forEach((drv) => {
          feedItems.push({
            id: `feed-drv-${drv.id}`,
            title: `Recruitment Drive: ${drv.title}`,
            summary: `${drv.companyName} • Package: ${drv.packageLPA} LPA. Check eligibility & apply.`,
            category: NotificationType.PLACEMENT,
            priority: NotificationPriority.HIGH,
            timestamp: drv.deadline,
            relativeTiming: "Apply Before Deadline",
            deepLink: `/dashboard/student/placements/${drv.id}`,
            sourceEntity: "PLACEMENT",
            badgeText: `${drv.packageLPA} LPA`,
            actionText: "View Drive",
          });
        });
      } catch {
        // Fallback gracefully
      }
    }

    // 6. Check Club Activities
    try {
      const { clubs } = await ClubService.getClubs({ userId, role, limit: 3 });
      if (clubs.length > 0) {
        const featuredClub = clubs[0];
        feedItems.push({
          id: `feed-club-${featuredClub.id}`,
          title: `Club Spotlight: ${featuredClub.name}`,
          summary: featuredClub.description.substring(0, 100) + "...",
          category: NotificationType.CLUB,
          priority: NotificationPriority.LOW,
          timestamp: new Date().toISOString(),
          relativeTiming: "Campus Community",
          deepLink: `/dashboard/student/clubs/${featuredClub.id}`,
          sourceEntity: "CLUB",
          badgeText: featuredClub.category,
          actionText: "Explore Club",
        });
      }
    } catch {
      // Fallback gracefully
    }

    // Sort by priority (URGENT > HIGH > NORMAL > LOW) then timestamp descending
    const priorityWeight: Record<NotificationPriority, number> = {
      URGENT: 4,
      HIGH: 3,
      NORMAL: 2,
      LOW: 1,
    };

    feedItems.sort((a, b) => {
      const pDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      if (pDiff !== 0) return pDiff;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    const deadlinesCount = feedItems.filter((i) => i.category === NotificationType.ASSIGNMENT).length;
    const urgentCount = feedItems.filter((i) => i.isUrgent).length;

    return {
      items: feedItems.slice(0, 12),
      deadlinesCount,
      urgentCount,
      lastUpdated: new Date().toISOString(),
    };
  }
}
