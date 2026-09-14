import { prisma } from "@/lib/prisma";
import { isDatabaseOnline } from "@/lib/db-health";
import {
  ClubCategory,
  ClubStatus,
  MembershipRole,
  MembershipStatus,
  ClubActivityType,
  Role,
  NotificationType,
} from "@prisma/client";
import {
  DEMO_CLUBS_STORE,
  DemoClub,
  DemoClubMembership,
  DemoClubActivity,
} from "@/lib/club/demo-clubs";
import { DEMO_EVENTS_STORE } from "@/lib/event/demo-events";
import { NotificationService } from "@/services/notification.service";
import { CreateClubInput, UpdateClubInput, CreateActivityInput } from "@/validators/club.schema";

export interface ClubFilterOptions {
  userId?: string;
  role?: Role | string;
  category?: ClubCategory;
  departmentId?: string | null;
  status?: ClubStatus;
  search?: string;
  membershipStatus?: "ALL" | "MEMBER" | "PENDING" | "NON_MEMBER";
  sort?: "most_members" | "most_active" | "recent" | "upcoming_events";
  limit?: number;
  offset?: number;
}

export interface ClubAnalyticsData {
  clubId: string;
  totalMembers: number;
  pendingRequests: number;
  activeEventsCount: number;
  totalEventRegistrations: number;
  totalActivitiesCount: number;
  engagementScore: number;
  engagementTier: "Elite" | "High" | "Active" | "Developing";
}

export class ClubService {
  /**
   * Helper to slugify a string
   */
  static slugify(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /**
   * Transparent & Deterministic Engagement Score Formula
   * Score = min(100, round((activeMembers * 2) + (upcomingEvents * 10) + (eventRegistrations * 1.5) + (activities * 5)))
   */
  static calculateEngagementScore(club: DemoClub): {
    score: number;
    tier: "Elite" | "High" | "Active" | "Developing";
  } {
    const activeMembers = club.memberships.filter(
      (m) => m.status === MembershipStatus.ACTIVE || m.status === MembershipStatus.APPROVED
    ).length;

    // Fetch linked events from DEMO_EVENTS_STORE
    const linkedEvents = DEMO_EVENTS_STORE.filter((e) =>
      club.linkedEventIds.includes(e.id)
    );
    const now = new Date();
    const upcomingEvents = linkedEvents.filter((e) => new Date(e.endDateTime) > now).length;

    let totalRegistrations = 0;
    for (const evt of linkedEvents) {
      totalRegistrations += evt.registrations.filter(
        (r) => r.status === "REGISTERED" || r.status === "ATTENDED"
      ).length;
    }

    const activitiesCount = club.activities.length;

    const rawScore =
      activeMembers * 2 +
      upcomingEvents * 10 +
      totalRegistrations * 1.5 +
      activitiesCount * 5;

    const score = Math.min(100, Math.max(0, Math.round(rawScore)));

    let tier: "Elite" | "High" | "Active" | "Developing" = "Developing";
    if (score >= 85) tier = "Elite";
    else if (score >= 65) tier = "High";
    else if (score >= 40) tier = "Active";

    return { score, tier };
  }

  /**
   * Get clubs list with filters, sorting, and user status
   */
  static async getClubs(options: ClubFilterOptions = {}): Promise<{
    clubs: any[];
    total: number;
  }> {
    const {
      userId,
      role,
      category,
      departmentId,
      status,
      search,
      membershipStatus = "ALL",
      sort = "most_members",
      limit = 100,
      offset = 0,
    } = options;

    let list = [...DEMO_CLUBS_STORE];

    // Visibility: Draft clubs visible only to Admin
    if (role !== Role.ADMIN) {
      list = list.filter((c) => c.status !== ClubStatus.DRAFT);
    }

    // Filter status
    if (status) {
      list = list.filter((c) => c.status === status);
    }

    // Filter category
    if (category) {
      list = list.filter((c) => c.category === category);
    }

    // Filter department
    if (departmentId) {
      list = list.filter((c) => c.departmentId === departmentId);
    }

    // Filter search
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.shortDescription.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
      );
    }

    // Filter membership status relative to user
    if (userId && membershipStatus !== "ALL") {
      list = list.filter((c) => {
        const userMem = c.memberships.find((m) => m.userId === userId);
        if (membershipStatus === "MEMBER") {
          return userMem?.status === MembershipStatus.ACTIVE || userMem?.status === MembershipStatus.APPROVED;
        }
        if (membershipStatus === "PENDING") {
          return userMem?.status === MembershipStatus.PENDING;
        }
        if (membershipStatus === "NON_MEMBER") {
          return !userMem || userMem.status === MembershipStatus.LEFT || userMem.status === MembershipStatus.REJECTED;
        }
        return true;
      });
    }

    // Compute enriched stats for each club
    const enriched = list.map((c) => {
      const activeMembers = c.memberships.filter(
        (m) => m.status === MembershipStatus.ACTIVE || m.status === MembershipStatus.APPROVED
      );
      const pendingMembers = c.memberships.filter(
        (m) => m.status === MembershipStatus.PENDING
      );
      const linkedEvents = DEMO_EVENTS_STORE.filter((e) =>
        c.linkedEventIds.includes(e.id)
      );
      const upcomingEvents = linkedEvents.filter(
        (e) => new Date(e.endDateTime) > new Date()
      );
      const userMem = userId ? c.memberships.find((m) => m.userId === userId) : undefined;
      const { score, tier } = this.calculateEngagementScore(c);

      return {
        ...c,
        memberCount: activeMembers.length,
        pendingCount: pendingMembers.length,
        upcomingEventsCount: upcomingEvents.length,
        engagementScore: score,
        engagementTier: tier,
        userMembership: userMem
          ? {
              id: userMem.id,
              role: userMem.role,
              status: userMem.status,
              appliedAt: userMem.appliedAt,
              joinedAt: userMem.joinedAt,
            }
          : null,
      };
    });

    // Sorting
    enriched.sort((a, b) => {
      if (sort === "most_members") return b.memberCount - a.memberCount;
      if (sort === "most_active") return b.engagementScore - a.engagementScore;
      if (sort === "upcoming_events") return b.upcomingEventsCount - a.upcomingEventsCount;
      if (sort === "recent") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    });

    const paginated = enriched.slice(offset, offset + limit);
    return { clubs: paginated, total: enriched.length };
  }

  /**
   * Get single club by ID or slug
   */
  static async getClubById(
    idOrSlug: string,
    userId?: string,
    role?: Role | string
  ): Promise<any | null> {
    const club = DEMO_CLUBS_STORE.find(
      (c) => c.id === idOrSlug || c.slug === idOrSlug
    );
    if (!club) return null;

    // Draft visibility restriction
    if (club.status === ClubStatus.DRAFT && role !== Role.ADMIN) {
      return null;
    }

    const activeMembers = club.memberships.filter(
      (m) => m.status === MembershipStatus.ACTIVE || m.status === MembershipStatus.APPROVED
    );
    const pendingMembers = club.memberships.filter(
      (m) => m.status === MembershipStatus.PENDING
    );

    // Linked Phase 8 events
    const linkedEvents = DEMO_EVENTS_STORE.filter((e) =>
      club.linkedEventIds.includes(e.id)
    ).map((e) => {
      const activeRegs = e.registrations.filter(
        (r) => r.status === "REGISTERED" || r.status === "ATTENDED"
      ).length;
      return {
        id: e.id,
        slug: e.slug,
        title: e.title,
        summary: e.summary,
        category: e.category,
        status: e.status,
        venue: e.venue,
        startDateTime: e.startDateTime,
        endDateTime: e.endDateTime,
        capacity: e.capacity,
        seatsRemaining: Math.max(0, e.capacity - activeRegs),
        posterUrl: e.posterUrl,
      };
    });

    const userMem = userId
      ? club.memberships.find(
          (m) =>
            m.userId === userId &&
            (m.status === MembershipStatus.ACTIVE ||
              m.status === MembershipStatus.APPROVED ||
              m.status === MembershipStatus.PENDING)
        )
      : undefined;
    const isCoordinator =
      role === Role.ADMIN ||
      club.coordinatorId === userId ||
      club.facultyAdvisorId === userId ||
      userMem?.role === MembershipRole.COORDINATOR;

    const { score, tier } = this.calculateEngagementScore(club);

    return {
      ...club,
      memberCount: activeMembers.length,
      pendingCount: pendingMembers.length,
      activeMembers: activeMembers.map((m) => ({
        id: m.id,
        userId: m.userId,
        userName: m.userName,
        userEmail: m.userEmail,
        rollNumber: m.rollNumber,
        departmentName: m.departmentName,
        semester: m.semester,
        role: m.role,
        status: m.status,
        joinedAt: m.joinedAt,
      })),
      // Hide pending roster from ordinary students
      pendingMembers: isCoordinator
        ? pendingMembers.map((m) => ({
            id: m.id,
            userId: m.userId,
            userName: m.userName,
            userEmail: m.userEmail,
            rollNumber: m.rollNumber,
            departmentName: m.departmentName,
            semester: m.semester,
            role: m.role,
            status: m.status,
            appliedAt: m.appliedAt,
          }))
        : [],
      activities: [...club.activities].sort(
        (a, b) => new Date(b.activityDate).getTime() - new Date(a.activityDate).getTime()
      ),
      upcomingEvents: linkedEvents,
      events: linkedEvents,
      engagementScore: score,
      engagementTier: tier,
      isCoordinator,
      userMembership: userMem
        ? {
            id: userMem.id,
            role: userMem.role,
            status: userMem.status,
            appliedAt: userMem.appliedAt,
            joinedAt: userMem.joinedAt,
          }
        : null,
    };
  }

  /**
   * Create a new club (Admin only)
   */
  static async createClub(
    input: CreateClubInput,
    adminUserId: string,
    userRole: Role | string = Role.ADMIN
  ): Promise<DemoClub> {
    if (userRole !== Role.ADMIN) {
      throw new Error("Forbidden: Only administrators can create new student organizations");
    }

    const slug = input.slug || this.slugify(input.name);

    // Verify uniqueness
    const existing = DEMO_CLUBS_STORE.find(
      (c) => c.name.toLowerCase() === input.name.toLowerCase() || c.slug === slug
    );
    if (existing) {
      throw new Error(`A club with the name "${input.name}" or slug "${slug}" already exists`);
    }

    const now = new Date().toISOString();
    const newClub: DemoClub = {
      id: `club-${Date.now().toString(36)}`,
      name: input.name,
      slug,
      shortDescription: input.shortDescription || input.description.slice(0, 150),
      description: input.description,
      category: input.category,
      status: input.status || ClubStatus.ACTIVE,
      departmentId: input.departmentId || null,
      departmentName: input.departmentId ? "Engineering Department" : null,
      facultyAdvisorId: input.facultyAdvisorId || null,
      facultyAdvisorName: input.facultyAdvisorId ? "Faculty Advisor" : null,
      coordinatorId: input.coordinatorId || null,
      coordinatorName: input.coordinatorId ? "Student Coordinator" : null,
      logoUrl: input.logoUrl || "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=300&q=80",
      bannerUrl: input.bannerUrl || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&q=80",
      contactEmail: input.contactEmail || `info@${slug}.campussphere.edu`,
      contactPhone: input.contactPhone || null,
      establishedYear: input.establishedYear || new Date().getFullYear(),
      isRecruiting: input.isRecruiting !== undefined ? input.isRecruiting : true,
      memberships: [],
      activities: [],
      linkedEventIds: [],
      createdAt: now,
      updatedAt: now,
    };

    DEMO_CLUBS_STORE.push(newClub);

    // Audit log
    await this.recordAuditLog({
      action: "CREATE_CLUB",
      entity: "Club",
      entityId: newClub.id,
      userId: adminUserId,
      details: { name: newClub.name, category: newClub.category },
    });

    return newClub;
  }

  /**
   * Update club details (Coordinator / Faculty Advisor / Admin)
   */
  static async updateClub(
    clubId: string,
    input: UpdateClubInput,
    userId: string,
    role: Role | string
  ): Promise<DemoClub> {
    const club = DEMO_CLUBS_STORE.find((c) => c.id === clubId);
    if (!club) throw new Error("Club not found");

    // Security check
    const isAuthorized =
      role === Role.ADMIN ||
      club.coordinatorId === userId ||
      club.facultyAdvisorId === userId;

    if (!isAuthorized) {
      throw new Error("Forbidden: You do not have permission to manage this club");
    }

    // Non-admins cannot alter status to SUSPENDED or ARCHIVED
    if (input.status && (input.status === ClubStatus.SUSPENDED || input.status === ClubStatus.ARCHIVED)) {
      if (role !== Role.ADMIN) {
        throw new Error("Forbidden: Only administrators can suspend or archive student organizations");
      }
    }

    if (input.name && input.name !== club.name) {
      const existing = DEMO_CLUBS_STORE.find(
        (c) => c.id !== clubId && c.name.toLowerCase() === input.name!.toLowerCase()
      );
      if (existing) throw new Error(`Club name "${input.name}" is already taken`);
      club.name = input.name;
    }

    if (input.slug && input.slug !== club.slug) {
      const existing = DEMO_CLUBS_STORE.find(
        (c) => c.id !== clubId && c.slug === input.slug
      );
      if (existing) throw new Error(`Club slug "${input.slug}" is already taken`);
      club.slug = input.slug;
    }

    if (input.description !== undefined) club.description = input.description;
    if (input.shortDescription !== undefined) club.shortDescription = input.shortDescription || "";
    if (input.category) club.category = input.category;
    if (input.status) club.status = input.status;
    if (input.logoUrl !== undefined) club.logoUrl = input.logoUrl || club.logoUrl;
    if (input.bannerUrl !== undefined) club.bannerUrl = input.bannerUrl || club.bannerUrl;
    if (input.contactEmail !== undefined) club.contactEmail = input.contactEmail || club.contactEmail;
    if (input.contactPhone !== undefined) club.contactPhone = input.contactPhone;
    if (input.isRecruiting !== undefined) club.isRecruiting = input.isRecruiting;

    club.updatedAt = new Date().toISOString();

    await this.recordAuditLog({
      action: "UPDATE_CLUB",
      entity: "Club",
      entityId: club.id,
      userId,
      details: { updatedFields: Object.keys(input) },
    });

    return club;
  }

  /**
   * Publish a draft club (Admin only)
   */
  static async publishClub(clubId: string, adminUserId: string): Promise<DemoClub> {
    const club = DEMO_CLUBS_STORE.find((c) => c.id === clubId);
    if (!club) throw new Error("Club not found");

    club.status = ClubStatus.ACTIVE;
    club.updatedAt = new Date().toISOString();

    await this.recordAuditLog({
      action: "PUBLISH_CLUB",
      entity: "Club",
      entityId: club.id,
      userId: adminUserId,
      details: { name: club.name },
    });

    return club;
  }

  /**
   * Request membership in a club (Join)
   */
  static async requestMembership(
    clubId: string,
    studentUser: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      studentId?: string;
      rollNumber?: string;
      departmentName?: string;
      semester?: number;
    },
    message?: string
  ): Promise<DemoClubMembership> {
    const club = DEMO_CLUBS_STORE.find((c) => c.id === clubId);
    if (!club) throw new Error("Club not found");

    if (club.status === ClubStatus.DRAFT) {
      throw new Error("This club has not yet been published");
    }
    if (club.status === ClubStatus.SUSPENDED) {
      throw new Error("This club is currently suspended and cannot accept new members");
    }
    if (club.status === ClubStatus.ARCHIVED) {
      throw new Error("This club is archived and no longer accepting memberships");
    }
    if (!club.isRecruiting) {
      throw new Error("This club is not currently recruiting new members");
    }

    // Check duplicate membership
    const existing = club.memberships.find((m) => m.userId === studentUser.id);
    if (existing) {
      if (existing.status === MembershipStatus.ACTIVE || existing.status === MembershipStatus.APPROVED) {
        throw new Error("You are already an active member of this club");
      }
      if (existing.status === MembershipStatus.PENDING) {
        throw new Error("Your membership request for this club is already pending approval");
      }
      // If previously LEFT or REJECTED, reset to PENDING
      existing.status = MembershipStatus.PENDING;
      existing.appliedAt = new Date().toISOString();
      existing.leftAt = null;
      club.updatedAt = new Date().toISOString();

      await this.notifyCoordinatorsOnNewRequest(club, studentUser.firstName + " " + studentUser.lastName);
      return existing;
    }

    const now = new Date().toISOString();
    const newMembership: DemoClubMembership = {
      id: `mem-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      clubId: club.id,
      userId: studentUser.id,
      studentId: studentUser.studentId || `STU-${studentUser.id.slice(0, 6)}`,
      userName: `${studentUser.firstName} ${studentUser.lastName}`,
      userEmail: studentUser.email,
      rollNumber: studentUser.rollNumber || "22COMPA101",
      departmentName: studentUser.departmentName || "Computer Engineering",
      semester: studentUser.semester || 6,
      role: MembershipRole.MEMBER,
      status: MembershipStatus.PENDING,
      appliedAt: now,
    };

    club.memberships.push(newMembership);
    club.updatedAt = now;

    // Student confirmation notification
    await NotificationService.sendNotification({
      userId: studentUser.id,
      title: "Club Membership Application Submitted",
      message: `Your application to join "${club.name}" has been received and is awaiting coordinator approval.`,
      type: NotificationType.SYSTEM,
      link: `/dashboard/student/clubs/${club.id}`,
    });

    // Notify coordinator
    await this.notifyCoordinatorsOnNewRequest(club, newMembership.userName);

    return newMembership;
  }

  /**
   * Leave a club or cancel a pending application
   */
  static async leaveClub(
    clubId: string,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    const club = DEMO_CLUBS_STORE.find((c) => c.id === clubId);
    if (!club) throw new Error("Club not found");

    const memIndex = club.memberships.findIndex(
      (m) =>
        m.userId === userId &&
        (m.status === MembershipStatus.ACTIVE ||
          m.status === MembershipStatus.APPROVED ||
          m.status === MembershipStatus.PENDING)
    );

    if (memIndex === -1) {
      throw new Error("No active or pending membership found for this club");
    }

    const mem = club.memberships[memIndex];
    const prevStatus = mem.status;
    mem.status = MembershipStatus.LEFT;
    mem.leftAt = new Date().toISOString();
    club.updatedAt = new Date().toISOString();

    await this.recordAuditLog({
      action: "LEAVE_CLUB",
      entity: "ClubMembership",
      entityId: mem.id,
      userId,
      details: { clubName: club.name, previousStatus: prevStatus },
    });

    return { success: true, message: "You have left the club successfully" };
  }

  /**
   * Approve a pending membership request
   */
  static async approveMembership(
    clubId: string,
    membershipId: string,
    approverUserId: string,
    approverRole: Role | string
  ): Promise<DemoClubMembership> {
    const club = DEMO_CLUBS_STORE.find((c) => c.id === clubId);
    if (!club) throw new Error("Club not found");

    const isAuthorized =
      approverRole === Role.ADMIN ||
      club.coordinatorId === approverUserId ||
      club.facultyAdvisorId === approverUserId;

    if (!isAuthorized) {
      throw new Error("Forbidden: Only the club coordinator, faculty advisor, or admin can approve membership requests");
    }

    const mem = club.memberships.find((m) => m.id === membershipId);
    if (!mem) throw new Error("Membership application not found");

    if (mem.status === MembershipStatus.ACTIVE || mem.status === MembershipStatus.APPROVED) {
      throw new Error("This member is already active");
    }

    const now = new Date().toISOString();
    mem.status = MembershipStatus.ACTIVE;
    mem.approvedAt = now;
    mem.joinedAt = now;
    mem.approvedBy = approverUserId;
    club.updatedAt = now;

    // Notify approved student
    await NotificationService.sendNotification({
      userId: mem.userId,
      title: "Membership Approved! Welcome!",
      message: `Your membership application for "${club.name}" has been approved. Welcome to the club!`,
      type: NotificationType.SYSTEM,
      link: `/dashboard/student/clubs/${club.id}`,
    });

    await this.recordAuditLog({
      action: "APPROVE_CLUB_MEMBERSHIP",
      entity: "ClubMembership",
      entityId: mem.id,
      userId: approverUserId,
      details: { studentName: mem.userName, clubName: club.name },
    });

    return mem;
  }

  /**
   * Reject a pending membership request
   */
  static async rejectMembership(
    clubId: string,
    membershipId: string,
    rejecterUserId: string,
    rejecterRole: Role | string
  ): Promise<DemoClubMembership> {
    const club = DEMO_CLUBS_STORE.find((c) => c.id === clubId);
    if (!club) throw new Error("Club not found");

    const isAuthorized =
      rejecterRole === Role.ADMIN ||
      club.coordinatorId === rejecterUserId ||
      club.facultyAdvisorId === rejecterUserId;

    if (!isAuthorized) {
      throw new Error("Forbidden: Only the club coordinator, faculty advisor, or admin can reject membership requests");
    }

    const mem = club.memberships.find((m) => m.id === membershipId);
    if (!mem) throw new Error("Membership application not found");

    mem.status = MembershipStatus.REJECTED;
    club.updatedAt = new Date().toISOString();

    // Notify student
    await NotificationService.sendNotification({
      userId: mem.userId,
      title: "Club Application Update",
      message: `Your membership application for "${club.name}" was not accepted at this time.`,
      type: NotificationType.SYSTEM,
      link: `/dashboard/student/clubs/${club.id}`,
    });

    await this.recordAuditLog({
      action: "REJECT_CLUB_MEMBERSHIP",
      entity: "ClubMembership",
      entityId: mem.id,
      userId: rejecterUserId,
      details: { studentName: mem.userName, clubName: club.name },
    });

    return mem;
  }

  /**
   * Update member role (e.g. promote to CORE_MEMBER, COORDINATOR)
   */
  static async updateMemberRole(
    clubId: string,
    membershipId: string,
    newRole: MembershipRole,
    updaterUserId: string,
    updaterRole: Role | string
  ): Promise<DemoClubMembership> {
    const club = DEMO_CLUBS_STORE.find((c) => c.id === clubId);
    if (!club) throw new Error("Club not found");

    const isAuthorized =
      updaterRole === Role.ADMIN ||
      club.coordinatorId === updaterUserId ||
      club.facultyAdvisorId === updaterUserId;

    if (!isAuthorized) {
      throw new Error("Forbidden: You do not have permission to modify member roles");
    }

    const mem = club.memberships.find((m) => m.id === membershipId);
    if (!mem) throw new Error("Member not found");

    const oldRole = mem.role;
    mem.role = newRole;
    club.updatedAt = new Date().toISOString();

    await this.recordAuditLog({
      action: "UPDATE_MEMBER_ROLE",
      entity: "ClubMembership",
      entityId: mem.id,
      userId: updaterUserId,
      details: { oldRole, newRole, studentName: mem.userName },
    });

    return mem;
  }

  /**
   * Remove member from club
   */
  static async removeMember(
    clubId: string,
    membershipId: string,
    removerUserId: string,
    removerRole: Role | string
  ): Promise<DemoClubMembership> {
    const club = DEMO_CLUBS_STORE.find((c) => c.id === clubId);
    if (!club) throw new Error("Club not found");

    const isAuthorized =
      removerRole === Role.ADMIN ||
      club.coordinatorId === removerUserId ||
      club.facultyAdvisorId === removerUserId;

    if (!isAuthorized) {
      throw new Error("Forbidden: You do not have permission to remove members");
    }

    const mem = club.memberships.find((m) => m.id === membershipId);
    if (!mem) throw new Error("Member not found");

    mem.status = MembershipStatus.LEFT;
    mem.leftAt = new Date().toISOString();
    club.updatedAt = new Date().toISOString();

    await this.recordAuditLog({
      action: "REMOVE_CLUB_MEMBER",
      entity: "ClubMembership",
      entityId: mem.id,
      userId: removerUserId,
      details: { studentName: mem.userName, clubName: club.name },
    });

    return mem;
  }

  /**
   * Create club activity
   */
  static async createActivity(
    clubId: string,
    input: CreateActivityInput,
    creatorUserId: string,
    creatorRole: Role | string
  ): Promise<DemoClubActivity> {
    const club = DEMO_CLUBS_STORE.find((c) => c.id === clubId);
    if (!club) throw new Error("Club not found");

    if (club.status === ClubStatus.SUSPENDED) {
      throw new Error("Cannot schedule activities for a suspended club");
    }

    const isAuthorized =
      creatorRole === Role.ADMIN ||
      club.coordinatorId === creatorUserId ||
      club.facultyAdvisorId === creatorUserId;

    if (!isAuthorized) {
      throw new Error("Forbidden: Only the club coordinator or advisor can create activities");
    }

    const now = new Date().toISOString();
    const newActivity: DemoClubActivity = {
      id: `act-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      clubId: club.id,
      title: input.title,
      description: input.description,
      activityDate: input.activityDate,
      activityType: input.activityType,
      venue: input.venue || null,
      createdBy: creatorUserId,
      createdAt: now,
      updatedAt: now,
    };

    club.activities.unshift(newActivity);
    club.updatedAt = now;

    // Notify club members
    const activeMemberUserIds = club.memberships
      .filter((m) => m.status === MembershipStatus.ACTIVE || m.status === MembershipStatus.APPROVED)
      .map((m) => m.userId)
      .filter((uid) => uid !== creatorUserId);

    if (activeMemberUserIds.length > 0) {
      await NotificationService.sendBulkNotification({
        userIds: activeMemberUserIds,
        title: `New Club Activity: ${club.name}`,
        message: `${newActivity.title} scheduled for ${new Date(newActivity.activityDate).toLocaleDateString()}.`,
        type: NotificationType.EVENT,
        link: `/dashboard/student/clubs/${club.id}`,
      });
    }

    return newActivity;
  }

  /**
   * Delete club activity
   */
  static async deleteActivity(
    clubId: string,
    activityId: string,
    userId: string,
    role: Role | string
  ): Promise<{ success: boolean }> {
    const club = DEMO_CLUBS_STORE.find((c) => c.id === clubId);
    if (!club) throw new Error("Club not found");

    const isAuthorized =
      role === Role.ADMIN ||
      club.coordinatorId === userId ||
      club.facultyAdvisorId === userId;

    if (!isAuthorized) {
      throw new Error("Forbidden: You do not have permission to delete this activity");
    }

    const idx = club.activities.findIndex((a) => a.id === activityId);
    if (idx === -1) throw new Error("Activity not found");

    club.activities.splice(idx, 1);
    club.updatedAt = new Date().toISOString();

    return { success: true };
  }

  /**
   * Get telemetry analytics for coordinator or admin
   */
  static async getClubAnalytics(
    clubId: string,
    userId: string,
    role: Role | string
  ): Promise<ClubAnalyticsData> {
    const club = DEMO_CLUBS_STORE.find((c) => c.id === clubId);
    if (!club) throw new Error("Club not found");

    const isAuthorized =
      role === Role.ADMIN ||
      club.coordinatorId === userId ||
      club.facultyAdvisorId === userId;

    if (!isAuthorized) {
      throw new Error("Forbidden: You do not have permission to view club telemetry");
    }

    const activeMembers = club.memberships.filter(
      (m) => m.status === MembershipStatus.ACTIVE || m.status === MembershipStatus.APPROVED
    ).length;

    const pendingRequests = club.memberships.filter(
      (m) => m.status === MembershipStatus.PENDING
    ).length;

    const linkedEvents = DEMO_EVENTS_STORE.filter((e) =>
      club.linkedEventIds.includes(e.id)
    );
    const activeEventsCount = linkedEvents.filter(
      (e) => new Date(e.endDateTime) > new Date()
    ).length;

    let totalEventRegistrations = 0;
    for (const evt of linkedEvents) {
      totalEventRegistrations += evt.registrations.filter(
        (r) => r.status === "REGISTERED" || r.status === "ATTENDED"
      ).length;
    }

    const totalActivitiesCount = club.activities.length;
    const { score, tier } = this.calculateEngagementScore(club);

    return {
      clubId: club.id,
      totalMembers: activeMembers,
      pendingRequests,
      activeEventsCount,
      totalEventRegistrations,
      totalActivitiesCount,
      engagementScore: score,
      engagementTier: tier,
    };
  }

  /**
   * Get clubs joined or applied to by a student
   */
  static async getUserClubs(userId: string): Promise<{
    active: any[];
    pending: any[];
    previous: any[];
  }> {
    const active: any[] = [];
    const pending: any[] = [];
    const previous: any[] = [];

    for (const club of DEMO_CLUBS_STORE) {
      const userMem = club.memberships.find((m) => m.userId === userId);
      if (!userMem) continue;

      const clubSummary = {
        id: club.id,
        name: club.name,
        slug: club.slug,
        category: club.category,
        shortDescription: club.shortDescription,
        logoUrl: club.logoUrl,
        bannerUrl: club.bannerUrl,
        memberCount: club.memberships.filter(
          (m) => m.status === MembershipStatus.ACTIVE || m.status === MembershipStatus.APPROVED
        ).length,
        upcomingEventsCount: DEMO_EVENTS_STORE.filter(
          (e) => club.linkedEventIds.includes(e.id) && new Date(e.endDateTime) > new Date()
        ).length,
        role: userMem.role,
        status: userMem.status,
        joinedAt: userMem.joinedAt,
        appliedAt: userMem.appliedAt,
        latestActivity: club.activities[0] || null,
      };

      if (userMem.status === MembershipStatus.ACTIVE || userMem.status === MembershipStatus.APPROVED) {
        active.push(clubSummary);
      } else if (userMem.status === MembershipStatus.PENDING) {
        pending.push(clubSummary);
      } else {
        previous.push(clubSummary);
      }
    }

    return { active, pending, previous };
  }

  /**
   * Helper to notify coordinators of new membership requests
   */
  private static async notifyCoordinatorsOnNewRequest(club: DemoClub, studentName: string): Promise<void> {
    const recipientIds: string[] = [];
    if (club.coordinatorId) recipientIds.push(club.coordinatorId);
    if (club.facultyAdvisorId) recipientIds.push(club.facultyAdvisorId);

    // Also notify any member with role COORDINATOR
    for (const mem of club.memberships) {
      if (mem.role === MembershipRole.COORDINATOR && !recipientIds.includes(mem.userId)) {
        recipientIds.push(mem.userId);
      }
    }

    if (recipientIds.length > 0) {
      await NotificationService.sendBulkNotification({
        userIds: recipientIds,
        title: `New Membership Request: ${club.name}`,
        message: `${studentName} has requested to join ${club.name}. Review application in Club Station.`,
        type: NotificationType.SYSTEM,
        link: `/dashboard/club/members`,
      });
    }
  }

  /**
   * Helper to record audit logs
   */
  private static async recordAuditLog({
    action,
    entity,
    entityId,
    userId,
    details,
  }: {
    action: string;
    entity: string;
    entityId?: string;
    userId?: string;
    details?: any;
  }): Promise<void> {
    try {
      if (await isDatabaseOnline()) {
        await prisma.auditLog.create({
          data: {
            action,
            entity,
            entityId,
            userId,
            details: details || {},
          },
        });
      }
    } catch (err) {
      // In offline / memory mode, audit logging is non-blocking
    }
  }
}
