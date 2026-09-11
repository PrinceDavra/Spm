import { prisma } from "@/lib/prisma";
import { isDatabaseOnline } from "@/lib/db-health";
import {
  NoticeCategory,
  NoticePriority,
  NoticeAudience,
  NoticeStatus,
  NotificationType,
  Role,
} from "@prisma/client";
import {
  DEMO_NOTICES_STORE,
  DemoNotice,
  DemoNoticeAttachment,
  DemoNoticeRead,
} from "@/lib/notice/demo-notices";
import { NotificationService } from "@/services/notification.service";
import { CreateNoticeInput, UpdateNoticeInput } from "@/validators/notice.schema";

export interface NoticeFilterOptions {
  userId?: string;
  role?: Role | string;
  departmentId?: string | null;
  divisionId?: string | null;
  semester?: number | null;
  category?: NoticeCategory;
  priority?: NoticePriority;
  status?: NoticeStatus;
  search?: string;
  limit?: number;
  offset?: number;
  includeArchived?: boolean;
}

export interface NoticeReachStats {
  totalRecipients: number;
  readCount: number;
  unreadCount: number;
  readPercentage: number;
}

export class NoticeService {
  /**
   * Helper: compute whether a given user is in the target audience of a notice.
   */
  static isUserInAudience(
    notice: DemoNotice,
    user: {
      userId?: string;
      role?: Role | string;
      departmentId?: string | null;
      divisionId?: string | null;
      semester?: number | null;
    }
  ): boolean {
    const { role, departmentId, divisionId, semester } = user;

    // Admin can access everything
    if (role === Role.ADMIN || role === "ADMIN") return true;

    // Authors can always access their notices
    if (user.userId && notice.authorId === user.userId) return true;

    // Drafts can only be viewed by their author or admin
    if (notice.status === NoticeStatus.DRAFT) return false;

    // Audience targeting logic
    switch (notice.audience) {
      case NoticeAudience.ALL:
        return true;

      case NoticeAudience.STUDENTS:
        return role === Role.STUDENT || role === "STUDENT";

      case NoticeAudience.FACULTY:
        return role === Role.FACULTY || role === "FACULTY";

      case NoticeAudience.STAFF:
        return (
          role === Role.FACULTY ||
          role === "FACULTY" ||
          role === Role.ADMIN ||
          role === "ADMIN" ||
          role === Role.PLACEMENT_OFFICER ||
          role === "PLACEMENT_OFFICER"
        );

      case NoticeAudience.ADMIN:
        return role === Role.ADMIN || role === "ADMIN";

      case NoticeAudience.DEPARTMENT:
        if (!notice.departmentId) return true;
        return departmentId === notice.departmentId;

      case NoticeAudience.CLASS:
        // Student class matches or matching department + semester
        if (notice.departmentId && departmentId && notice.departmentId !== departmentId) {
          return false;
        }
        if (notice.semester && semester && notice.semester !== semester) {
          return false;
        }
        return true;

      case NoticeAudience.DIVISION:
        if (notice.divisionId && divisionId) {
          return notice.divisionId === divisionId;
        }
        return false;

      case NoticeAudience.SEMESTER:
        if (notice.departmentId && departmentId && notice.departmentId !== departmentId) {
          return false;
        }
        if (notice.semester && semester) {
          return notice.semester === semester;
        }
        return false;

      default:
        return true;
    }
  }

  /**
   * Calculate reach and read rate for a specific notice.
   */
  static calculateReach(notice: DemoNotice): NoticeReachStats {
    let baselineRecipients = 120; // default class/division reach
    if (notice.audience === NoticeAudience.ALL) {
      baselineRecipients = 850;
    } else if (notice.audience === NoticeAudience.STUDENTS) {
      baselineRecipients = 720;
    } else if (notice.audience === NoticeAudience.FACULTY) {
      baselineRecipients = 85;
    } else if (notice.audience === NoticeAudience.DEPARTMENT) {
      baselineRecipients = 240;
    } else if (notice.audience === NoticeAudience.SEMESTER) {
      baselineRecipients = 180;
    } else if (notice.audience === NoticeAudience.DIVISION) {
      baselineRecipients = 65;
    }

    const readsCount = (notice.reads || []).length;
    // For realistic demo metrics, if notice is published, blend base reads
    const effectiveReads = Math.max(readsCount, notice.status === NoticeStatus.PUBLISHED ? Math.min(Math.round(baselineRecipients * 0.72), baselineRecipients) : 0);
    const unreadCount = Math.max(0, baselineRecipients - effectiveReads);
    const readPercentage = baselineRecipients > 0 ? Number(((effectiveReads / baselineRecipients) * 100).toFixed(1)) : 0;

    return {
      totalRecipients: baselineRecipients,
      readCount: effectiveReads,
      unreadCount,
      readPercentage,
    };
  }

  /**
   * Fetch notices matching role, audience, and search filters.
   */
  static async getNotices(options: NoticeFilterOptions = {}) {
    const {
      userId,
      role,
      departmentId,
      divisionId,
      semester,
      category,
      priority,
      status,
      search,
      limit = 50,
      offset = 0,
      includeArchived = false,
    } = options;

    let notices: DemoNotice[] = [...DEMO_NOTICES_STORE];

    // Filter by audience / role visibility
    notices = notices.filter((notice) => {
      // If user is student, hide drafts and archived (unless explicitly requested)
      if (role === Role.STUDENT || role === "STUDENT") {
        if (notice.status === NoticeStatus.DRAFT) return false;
        if (!includeArchived && notice.status === NoticeStatus.ARCHIVED) return false;
        // Don't show expired notices in active feed unless status filter explicitly asks
        if (!status && notice.status === NoticeStatus.EXPIRED) return false;
      }

      // If user is faculty, show public or own drafts
      if (role === Role.FACULTY || role === "FACULTY") {
        if (notice.status === NoticeStatus.DRAFT && notice.authorId !== userId) {
          return false;
        }
        if (!includeArchived && notice.status === NoticeStatus.ARCHIVED && notice.authorId !== userId) {
          return false;
        }
      }

      return this.isUserInAudience(notice, {
        userId,
        role,
        departmentId,
        divisionId,
        semester,
      });
    });

    // Apply explicit status filter
    if (status) {
      notices = notices.filter((n) => n.status === status);
    }

    // Apply category filter
    if (category) {
      notices = notices.filter((n) => n.category === category);
    }

    // Apply priority filter
    if (priority) {
      notices = notices.filter((n) => n.priority === priority);
    }

    // Apply text search
    if (search && search.trim().length > 0) {
      const q = search.trim().toLowerCase();
      notices = notices.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          (n.summary && n.summary.toLowerCase().includes(q)) ||
          n.category.toLowerCase().includes(q) ||
          n.authorName.toLowerCase().includes(q)
      );
    }

    // Sort: URGENT first, then newest publishDate
    notices.sort((a, b) => {
      if (a.priority === NoticePriority.URGENT && b.priority !== NoticePriority.URGENT) return -1;
      if (b.priority === NoticePriority.URGENT && a.priority !== NoticePriority.URGENT) return 1;
      return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
    });

    const totalCount = notices.length;
    const paginatedNotices = notices.slice(offset, offset + limit);

    // Enrich with read status for the calling user and reach stats
    const enriched = paginatedNotices.map((n) => {
      const isRead = userId ? (n.reads || []).some((r) => r.userId === userId) : false;
      const stats = this.calculateReach(n);
      return {
        ...n,
        isRead,
        reachStats: stats,
      };
    });

    return {
      notices: enriched,
      totalCount,
      hasMore: offset + limit < totalCount,
    };
  }

  /**
   * Get single notice by ID and mark it read for the user if applicable.
   */
  static async getNoticeById(
    noticeId: string,
    userContext?: {
      userId: string;
      role: Role | string;
      departmentId?: string | null;
      divisionId?: string | null;
      semester?: number | null;
    }
  ) {
    const notice = DEMO_NOTICES_STORE.find((n) => n.id === noticeId);
    if (!notice) {
      throw new Error("Notice not found");
    }

    // Enforce audience permissions if userContext is provided
    if (userContext) {
      const allowed = this.isUserInAudience(notice, userContext);
      if (!allowed) {
        throw new Error("Unauthorized: You do not have permission to view this notice");
      }

      // Auto-mark as read if notice is PUBLISHED and user hasn't read it yet
      if (notice.status === NoticeStatus.PUBLISHED && userContext.userId) {
        await this.markAsRead(noticeId, userContext.userId);
      }
    }

    const isRead = userContext?.userId
      ? (notice.reads || []).some((r) => r.userId === userContext.userId)
      : false;

    const stats = this.calculateReach(notice);

    return {
      ...notice,
      isRead,
      reachStats: stats,
    };
  }

  /**
   * Author a new notice.
   */
  static async createNotice(
    author: {
      id: string;
      role: Role | string;
      firstName: string;
      lastName: string;
      departmentId?: string | null;
    },
    input: CreateNoticeInput
  ): Promise<DemoNotice> {
    if (author.role === Role.STUDENT || author.role === "STUDENT") {
      throw new Error("Students are not permitted to create notices");
    }

    // Role-based Audience Constraints for Faculty
    if (author.role === Role.FACULTY || author.role === "FACULTY") {
      if (input.audience === NoticeAudience.ADMIN) {
        throw new Error("Faculty cannot target exclusively Administrative audience");
      }
    }

    const noticeId = `notice-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();
    const isDraft = input.status === NoticeStatus.DRAFT;

    const newNotice: DemoNotice = {
      id: noticeId,
      authorId: author.id,
      authorName: `${author.firstName} ${author.lastName}`,
      authorRole: author.role,
      title: input.title,
      summary: input.summary || input.content.substring(0, 180) + "...",
      content: input.content,
      category: input.category,
      priority: input.priority || NoticePriority.NORMAL,
      audience: input.audience || NoticeAudience.ALL,
      status: input.status || NoticeStatus.PUBLISHED,
      departmentId: input.departmentId || author.departmentId || null,
      classId: input.classId || null,
      divisionId: input.divisionId || null,
      semester: typeof input.semester === "number" ? input.semester : null,
      publishDate: input.publishDate || nowIso,
      expiryDate: input.expiryDate || null,
      attachmentUrl: input.attachmentUrl || (input.attachments && input.attachments[0]?.fileUrl) || null,
      isPublished: !isDraft,
      attachments: (input.attachments || []).map((att, idx) => ({
        id: `att-${Date.now()}-${idx}`,
        noticeId,
        fileName: att.fileName,
        fileUrl: att.fileUrl,
        fileType: att.fileType || "application/pdf",
        fileSize: att.fileSize,
        uploadedAt: nowIso,
      })),
      reads: [],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    DEMO_NOTICES_STORE.unshift(newNotice);

    // Database persistence if online
    try {
      if (await isDatabaseOnline()) {
        await prisma.notice.create({
          data: {
            id: newNotice.id,
            authorId: author.id,
            title: newNotice.title,
            summary: newNotice.summary,
            content: newNotice.content,
            category: newNotice.category,
            priority: newNotice.priority,
            audience: newNotice.audience,
            status: newNotice.status,
            departmentId: newNotice.departmentId,
            classId: newNotice.classId,
            divisionId: newNotice.divisionId,
            semester: newNotice.semester,
            publishDate: new Date(newNotice.publishDate),
            expiryDate: newNotice.expiryDate ? new Date(newNotice.expiryDate) : null,
            attachmentUrl: newNotice.attachmentUrl,
            isPublished: newNotice.isPublished,
            attachments: {
              create: newNotice.attachments.map((att) => ({
                id: att.id,
                fileName: att.fileName,
                fileUrl: att.fileUrl,
                fileType: att.fileType,
                fileSize: att.fileSize,
              })),
            },
          },
        });

        // Audit Log
        await prisma.auditLog.create({
          data: {
            userId: author.id,
            action: isDraft ? "SAVE_DRAFT_NOTICE" : "CREATE_NOTICE",
            entity: "Notice",
            entityId: newNotice.id,
            details: {
              title: newNotice.title,
              category: newNotice.category,
              priority: newNotice.priority,
              audience: newNotice.audience,
              status: newNotice.status,
            },
          },
        });
      }
    } catch (err) {
      console.warn("Notice DB persistence fallback:", err);
    }

    // Send notifications if published immediately
    if (newNotice.status === NoticeStatus.PUBLISHED) {
      await this.dispatchNoticeNotifications(newNotice);
    }

    return newNotice;
  }

  /**
   * Update an existing notice.
   */
  static async updateNotice(
    noticeId: string,
    userId: string,
    userRole: Role | string,
    input: UpdateNoticeInput
  ): Promise<DemoNotice> {
    const noticeIndex = DEMO_NOTICES_STORE.findIndex((n) => n.id === noticeId);
    if (noticeIndex === -1) {
      throw new Error("Notice not found");
    }

    const existing = DEMO_NOTICES_STORE[noticeIndex];

    // Ownership & RBAC check
    if (userRole !== Role.ADMIN && userRole !== "ADMIN") {
      if (existing.authorId !== userId) {
        throw new Error("Unauthorized: You may only edit notices you authored");
      }
    }

    if (existing.status === NoticeStatus.ARCHIVED && userRole !== Role.ADMIN && userRole !== "ADMIN") {
      throw new Error("Archived notices cannot be edited");
    }

    const updated: DemoNotice = {
      ...existing,
      title: input.title !== undefined ? input.title : existing.title,
      summary: input.summary !== undefined ? (input.summary || "") : existing.summary,
      content: input.content !== undefined ? input.content : existing.content,
      category: input.category !== undefined ? input.category : existing.category,
      priority: input.priority !== undefined ? input.priority : existing.priority,
      audience: input.audience !== undefined ? input.audience : existing.audience,
      status: input.status !== undefined ? input.status : existing.status,
      departmentId: input.departmentId !== undefined ? input.departmentId : existing.departmentId,
      classId: input.classId !== undefined ? input.classId : existing.classId,
      divisionId: input.divisionId !== undefined ? input.divisionId : existing.divisionId,
      semester: typeof input.semester === "number" ? input.semester : existing.semester,
      publishDate: input.publishDate !== undefined && input.publishDate ? input.publishDate : existing.publishDate,
      expiryDate: input.expiryDate !== undefined ? input.expiryDate : existing.expiryDate,
      attachmentUrl: input.attachmentUrl !== undefined ? input.attachmentUrl : existing.attachmentUrl,
      updatedAt: new Date().toISOString(),
    };

    if (input.attachments) {
      updated.attachments = input.attachments.map((att, idx) => ({
        id: `att-${Date.now()}-${idx}`,
        noticeId,
        fileName: att.fileName,
        fileUrl: att.fileUrl,
        fileType: att.fileType || "application/pdf",
        fileSize: att.fileSize,
        uploadedAt: new Date().toISOString(),
      }));
    }

    DEMO_NOTICES_STORE[noticeIndex] = updated;

    try {
      if (await isDatabaseOnline()) {
        await prisma.notice.update({
          where: { id: noticeId },
          data: {
            title: updated.title,
            summary: updated.summary,
            content: updated.content,
            category: updated.category,
            priority: updated.priority,
            audience: updated.audience,
            status: updated.status,
            departmentId: updated.departmentId,
            classId: updated.classId,
            divisionId: updated.divisionId,
            semester: updated.semester,
            expiryDate: updated.expiryDate ? new Date(updated.expiryDate) : null,
          },
        });

        await prisma.auditLog.create({
          data: {
            userId,
            action: "UPDATE_NOTICE",
            entity: "Notice",
            entityId: noticeId,
            details: { title: updated.title, status: updated.status },
          },
        });
      }
    } catch (err) {
      console.warn("Notice update DB fallback:", err);
    }

    return updated;
  }

  /**
   * Publish a draft notice.
   */
  static async publishNotice(noticeId: string, userId: string, userRole: Role | string): Promise<DemoNotice> {
    const notice = DEMO_NOTICES_STORE.find((n) => n.id === noticeId);
    if (!notice) throw new Error("Notice not found");

    if (userRole !== Role.ADMIN && userRole !== "ADMIN" && notice.authorId !== userId) {
      throw new Error("Unauthorized: Only the author or an admin can publish this notice");
    }

    if (notice.status === NoticeStatus.ARCHIVED) {
      throw new Error("Cannot publish an archived notice");
    }

    notice.status = NoticeStatus.PUBLISHED;
    notice.isPublished = true;
    notice.publishDate = new Date().toISOString();
    notice.updatedAt = new Date().toISOString();

    try {
      if (await isDatabaseOnline()) {
        await prisma.notice.update({
          where: { id: noticeId },
          data: {
            status: NoticeStatus.PUBLISHED,
            isPublished: true,
            publishDate: new Date(),
          },
        });

        await prisma.auditLog.create({
          data: {
            userId,
            action: "PUBLISH_NOTICE",
            entity: "Notice",
            entityId: noticeId,
            details: { title: notice.title, audience: notice.audience },
          },
        });
      }
    } catch (err) {
      console.warn("Notice publish DB fallback:", err);
    }

    await this.dispatchNoticeNotifications(notice);
    return notice;
  }

  /**
   * Archive a notice.
   */
  static async archiveNotice(noticeId: string, userId: string, userRole: Role | string): Promise<DemoNotice> {
    const notice = DEMO_NOTICES_STORE.find((n) => n.id === noticeId);
    if (!notice) throw new Error("Notice not found");

    if (userRole !== Role.ADMIN && userRole !== "ADMIN" && notice.authorId !== userId) {
      throw new Error("Unauthorized: Only the author or an admin can archive this notice");
    }

    notice.status = NoticeStatus.ARCHIVED;
    notice.updatedAt = new Date().toISOString();

    try {
      if (await isDatabaseOnline()) {
        await prisma.notice.update({
          where: { id: noticeId },
          data: { status: NoticeStatus.ARCHIVED },
        });

        await prisma.auditLog.create({
          data: {
            userId,
            action: "ARCHIVE_NOTICE",
            entity: "Notice",
            entityId: noticeId,
            details: { title: notice.title },
          },
        });
      }
    } catch (err) {
      console.warn("Notice archive DB fallback:", err);
    }

    return notice;
  }

  /**
   * Mark a notice as read by a specific user.
   */
  static async markAsRead(noticeId: string, userId: string): Promise<boolean> {
    const notice = DEMO_NOTICES_STORE.find((n) => n.id === noticeId);
    if (!notice) return false;

    if (!notice.reads) notice.reads = [];

    const alreadyRead = notice.reads.some((r) => r.userId === userId);
    if (!alreadyRead) {
      notice.reads.push({
        id: `read-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        noticeId,
        userId,
        readAt: new Date().toISOString(),
      });
    }

    try {
      if (await isDatabaseOnline()) {
        await prisma.noticeRead.upsert({
          where: {
            noticeId_userId: {
              noticeId,
              userId,
            },
          },
          create: {
            noticeId,
            userId,
          },
          update: {
            readAt: new Date(),
          },
        });
      }
    } catch {
      // In-memory already recorded
    }

    return true;
  }

  /**
   * Mark a notice as unread by removing user's read record.
   */
  static async markAsUnread(noticeId: string, userId: string): Promise<boolean> {
    const notice = DEMO_NOTICES_STORE.find((n) => n.id === noticeId);
    if (!notice || !notice.reads) return false;

    notice.reads = notice.reads.filter((r) => r.userId !== userId);

    try {
      if (await isDatabaseOnline()) {
        await prisma.noticeRead.deleteMany({
          where: {
            noticeId,
            userId,
          },
        });
      }
    } catch {
      // In-memory already removed
    }

    return true;
  }

  /**
   * Get unread notices count for a given user.
   */
  static async getUnreadCount(
    userId: string,
    role: Role | string,
    departmentId?: string | null,
    divisionId?: string | null,
    semester?: number | null
  ): Promise<number> {
    const { notices } = await this.getNotices({
      userId,
      role,
      departmentId,
      divisionId,
      semester,
      status: NoticeStatus.PUBLISHED,
    });

    return notices.filter((n) => !n.isRead).length;
  }

  /**
   * Get comprehensive notice analytics for Admin and Faculty.
   */
  static async getNoticeAnalytics(userId?: string, role?: Role | string) {
    let notices = [...DEMO_NOTICES_STORE];

    // If faculty, optionally focus on institutional + authored
    const isFaculty = role === Role.FACULTY || role === "FACULTY";
    const totalNotices = notices.length;
    const published = notices.filter((n) => n.status === NoticeStatus.PUBLISHED).length;
    const drafts = notices.filter((n) => n.status === NoticeStatus.DRAFT).length;
    const expired = notices.filter((n) => n.status === NoticeStatus.EXPIRED).length;
    const archived = notices.filter((n) => n.status === NoticeStatus.ARCHIVED).length;

    // Aggregate reach and reads
    let totalReach = 0;
    let totalReads = 0;
    const publishedNotices = notices.filter((n) => n.status === NoticeStatus.PUBLISHED);

    publishedNotices.forEach((n) => {
      const stats = this.calculateReach(n);
      totalReach += stats.totalRecipients;
      totalReads += stats.readCount;
    });

    const averageReadRate = totalReach > 0 ? Number(((totalReads / totalReach) * 100).toFixed(1)) : 0;

    // Category breakdown
    const categoryCounts: Record<string, number> = {};
    Object.values(NoticeCategory).forEach((cat) => {
      categoryCounts[cat] = 0;
    });
    notices.forEach((n) => {
      categoryCounts[n.category] = (categoryCounts[n.category] || 0) + 1;
    });

    const categoryBreakdown = Object.entries(categoryCounts).map(([cat, count]) => ({
      category: cat,
      count,
    }));

    // Top recent notices
    const recentPerformance = publishedNotices.slice(0, 5).map((n) => ({
      id: n.id,
      title: n.title,
      category: n.category,
      priority: n.priority,
      publishDate: n.publishDate,
      reachStats: this.calculateReach(n),
    }));

    return {
      metrics: {
        totalNotices,
        published,
        drafts,
        expired,
        archived,
        totalReach,
        totalReads,
        totalUnreads: Math.max(0, totalReach - totalReads),
        averageReadRate,
      },
      categoryBreakdown,
      recentPerformance,
    };
  }

  /**
   * Helper: Dispatch event-driven targeted notifications when a notice is published.
   */
  private static async dispatchNoticeNotifications(notice: DemoNotice): Promise<void> {
    const recipients: string[] = [];

    // Include demo users based on audience
    if (notice.audience === NoticeAudience.ALL) {
      recipients.push("demo-student-001", "demo-faculty-001");
    } else if (notice.audience === NoticeAudience.STUDENTS) {
      recipients.push("demo-student-001");
    } else if (notice.audience === NoticeAudience.FACULTY) {
      recipients.push("demo-faculty-001");
    } else if (
      notice.audience === NoticeAudience.DEPARTMENT ||
      notice.audience === NoticeAudience.DIVISION ||
      notice.audience === NoticeAudience.SEMESTER
    ) {
      if (notice.departmentId === "dept-comp" || !notice.departmentId) {
        recipients.push("demo-student-001");
      }
    }

    if (recipients.length > 0) {
      await NotificationService.sendBulkNotification({
        userIds: recipients,
        title: `Notice: ${notice.title}`,
        message: notice.summary || notice.content.substring(0, 120),
        type: NotificationType.NOTICE,
        link: `/dashboard/student/notices/${notice.id}`,
      });
    }
  }
}
