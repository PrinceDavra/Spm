import { prisma } from "@/lib/prisma";
import { isDatabaseOnline } from "@/lib/db-health";
import {
  EventCategory,
  EventStatus,
  EventAttendanceStatus,
  RegistrationStatus,
  Role,
} from "@prisma/client";
import {
  DEMO_EVENTS_STORE,
  DemoEvent,
  DemoEventRegistration,
} from "@/lib/event/demo-events";
import { NotificationService } from "./notification.service";
import { NotificationType } from "@prisma/client";
import { CreateEventInput, UpdateEventInput } from "@/validators/event.schema";

export interface EventFilterOptions {
  userId?: string;
  role?: Role;
  search?: string;
  category?: EventCategory;
  status?: EventStatus;
  tab?: "all" | "upcoming" | "registered" | "completed";
  sortBy?: "upcoming" | "latest" | "most_registered" | "date_asc";
  limit?: number;
  offset?: number;
}

export interface EventAnalytics {
  capacity: number;
  totalRegistered: number;
  availableSeats: number;
  registrationRate: number;
  cancellationCount: number;
  cancellationRate: number;
  attendedCount: number;
  absentCount: number;
  attendanceRate: number;
  noShowCount: number;
}

export class EventService {
  /**
   * Helper to format confirmation code
   */
  static generateConfirmationCode(slug: string): string {
    const prefix = slug.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, "EVT");
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    const ts = Date.now().toString(36).slice(-4).toUpperCase();
    return `CS-${prefix}-${ts}${rand}`;
  }

  /**
   * Calculate real-time seats remaining for an event
   */
  static calculateSeatsRemaining(event: { capacity: number; registrations?: { status: RegistrationStatus }[] }): number {
    const activeRegistrations = (event.registrations || []).filter(
      (r) => r.status === RegistrationStatus.REGISTERED || r.status === RegistrationStatus.ATTENDED
    );
    return Math.max(0, event.capacity - activeRegistrations.length);
  }

  /**
   * Get filtered discovery list of events
   */
  static async getEvents(options: EventFilterOptions = {}): Promise<{
    events: (DemoEvent & { seatsRemaining: number; isUserRegistered: boolean })[];
    total: number;
  }> {
    const {
      userId,
      role = Role.STUDENT,
      search,
      category,
      status,
      tab = "all",
      sortBy = "upcoming",
      limit = 50,
      offset = 0,
    } = options;

    const now = new Date();

    // In-memory filter
    let items = [...DEMO_EVENTS_STORE];

    // Role-based visibility
    if (role === Role.STUDENT) {
      items = items.filter((e) => e.status !== EventStatus.DRAFT && e.isPublished);
    } else if (role === Role.FACULTY || role === Role.CLUB_COORDINATOR || role === Role.PLACEMENT_OFFICER) {
      items = items.filter(
        (e) => (e.status !== EventStatus.DRAFT && e.isPublished) || e.organizerId === userId
      );
    } // ADMIN sees all

    // Search filter
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      items = items.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.summary.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.venue.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (category) {
      items = items.filter((e) => e.category === category);
    }

    // Status filter
    if (status) {
      items = items.filter((e) => e.status === status);
    }

    // Tab filter
    if (tab === "upcoming") {
      items = items.filter(
        (e) => new Date(e.endDateTime) >= now && e.status !== EventStatus.COMPLETED && e.status !== EventStatus.ARCHIVED
      );
    } else if (tab === "registered" && userId) {
      items = items.filter((e) =>
        e.registrations.some(
          (r) => r.userId === userId && (r.status === RegistrationStatus.REGISTERED || r.status === RegistrationStatus.ATTENDED)
        )
      );
    } else if (tab === "completed") {
      items = items.filter((e) => e.status === EventStatus.COMPLETED || new Date(e.endDateTime) < now);
    }

    // Sorting
    if (sortBy === "upcoming") {
      items.sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
    } else if (sortBy === "latest") {
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "most_registered") {
      items.sort((a, b) => b.registrations.length - a.registrations.length);
    } else if (sortBy === "date_asc") {
      items.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
    }

    const total = items.length;
    const paginated = items.slice(offset, offset + limit);

    const enriched = paginated.map((evt) => {
      const seatsRemaining = this.calculateSeatsRemaining(evt);
      const isUserRegistered = userId
        ? evt.registrations.some(
            (r) => r.userId === userId && (r.status === RegistrationStatus.REGISTERED || r.status === RegistrationStatus.ATTENDED)
          )
        : false;

      return {
        ...evt,
        seatsRemaining,
        isUserRegistered,
      };
    });

    return { events: enriched, total };
  }

  /**
   * Get single event detail by ID or Slug
   */
  static async getEventById(
    idOrSlug: string,
    userId?: string,
    userRole: Role = Role.STUDENT
  ): Promise<(DemoEvent & { seatsRemaining: number; isUserRegistered: boolean; userRegistration?: DemoEventRegistration }) | null> {
    const evt = DEMO_EVENTS_STORE.find((e) => e.id === idOrSlug || e.slug === idOrSlug);
    if (!evt) return null;

    // RBAC check: students cannot view drafts
    if (evt.status === EventStatus.DRAFT && userRole === Role.STUDENT) {
      return null;
    }
    if (
      evt.status === EventStatus.DRAFT &&
      userRole !== Role.ADMIN &&
      evt.organizerId !== userId
    ) {
      return null;
    }

    const seatsRemaining = this.calculateSeatsRemaining(evt);
    const userReg = userId
      ? evt.registrations.find(
          (r) => r.userId === userId && (r.status === RegistrationStatus.REGISTERED || r.status === RegistrationStatus.ATTENDED)
        )
      : undefined;

    return {
      ...evt,
      seatsRemaining,
      isUserRegistered: Boolean(userReg),
      userRegistration: userReg,
    };
  }

  /**
   * Create a new event (ADMIN, FACULTY, CLUB_COORDINATOR, PLACEMENT_OFFICER)
   */
  static async createEvent(
    data: CreateEventInput,
    organizerUser: { id: string; role: Role; firstName: string; lastName: string }
  ): Promise<DemoEvent> {
    // Generate slug from title if not provided
    const baseSlug =
      data.slug ||
      data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    
    // Ensure slug uniqueness
    let slug = baseSlug;
    let counter = 1;
    while (DEMO_EVENTS_STORE.some((e) => e.slug === slug)) {
      slug = `${baseSlug}-${counter++}`;
    }

    const newEvent: DemoEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      slug,
      title: data.title,
      summary: data.summary || data.description.slice(0, 150),
      description: data.description,
      category: data.category,
      status: data.status || EventStatus.PUBLISHED,
      organizerId: organizerUser.id,
      organizerName: `${organizerUser.firstName} ${organizerUser.lastName}`,
      organizerRole: organizerUser.role,
      venue: data.venue,
      eventDate: new Date(data.startDateTime).toISOString(),
      startDateTime: new Date(data.startDateTime).toISOString(),
      endDateTime: new Date(data.endDateTime).toISOString(),
      registrationOpenAt: data.registrationOpenAt
        ? new Date(data.registrationOpenAt).toISOString()
        : new Date().toISOString(),
      registrationDeadline: new Date(data.registrationDeadline).toISOString(),
      capacity: Number(data.capacity),
      posterUrl: data.posterUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80",
      isPublished: data.status !== EventStatus.DRAFT,
      registrations: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    DEMO_EVENTS_STORE.unshift(newEvent);

    // If published right away, send notification to students
    if (newEvent.isPublished && newEvent.status !== EventStatus.DRAFT) {
      await NotificationService.sendNotification({
        userId: "demo-student-001",
        title: `New Campus Event: ${newEvent.title}`,
        message: `${newEvent.category} event announced: "${newEvent.title}" at ${newEvent.venue}. Registration is now open!`,
        type: NotificationType.EVENT,
        link: `/dashboard/student/events/${newEvent.id}`,
      });
    }

    return newEvent;
  }

  /**
   * Update an existing event
   */
  static async updateEvent(
    id: string,
    data: UpdateEventInput,
    userId: string,
    userRole: Role
  ): Promise<DemoEvent> {
    const evt = DEMO_EVENTS_STORE.find((e) => e.id === id);
    if (!evt) throw new Error("Event not found");

    if (userRole !== Role.ADMIN && evt.organizerId !== userId) {
      throw new Error("Forbidden: You can only edit events you have organized");
    }

    if (data.title) evt.title = data.title;
    if (data.summary !== undefined) evt.summary = data.summary || evt.summary;
    if (data.description) evt.description = data.description;
    if (data.category) evt.category = data.category;
    if (data.venue) evt.venue = data.venue;
    if (data.capacity !== undefined) evt.capacity = Number(data.capacity);
    if (data.posterUrl !== undefined) evt.posterUrl = data.posterUrl || evt.posterUrl;
    if (data.startDateTime) evt.startDateTime = new Date(data.startDateTime).toISOString();
    if (data.endDateTime) evt.endDateTime = new Date(data.endDateTime).toISOString();
    if (data.registrationDeadline) evt.registrationDeadline = new Date(data.registrationDeadline).toISOString();
    if (data.status) {
      this.validateStateTransition(evt.status, data.status);
      evt.status = data.status;
      evt.isPublished = data.status !== EventStatus.DRAFT;
    }

    evt.updatedAt = new Date().toISOString();
    return evt;
  }

  /**
   * Validate lifecycle transitions
   */
  static validateStateTransition(current: EventStatus, next: EventStatus): boolean {
    if (current === next) return true;

    // Archived events cannot be reopened
    if (current === EventStatus.ARCHIVED) {
      throw new Error("Archived events cannot change status");
    }

    // Completed events cannot be reopened for registration
    if (current === EventStatus.COMPLETED && next === EventStatus.REGISTRATION_OPEN) {
      throw new Error("Completed events cannot reopen registration");
    }

    // Draft can go to PUBLISHED, REGISTRATION_OPEN, or ARCHIVED
    if (current === EventStatus.DRAFT) {
      if (next === EventStatus.COMPLETED) {
        throw new Error("Draft event cannot directly transition to Completed");
      }
    }

    return true;
  }

  /**
   * Publish an event
   */
  static async publishEvent(id: string, userId: string, userRole: Role): Promise<DemoEvent> {
    const evt = DEMO_EVENTS_STORE.find((e) => e.id === id);
    if (!evt) throw new Error("Event not found");

    if (userRole !== Role.ADMIN && evt.organizerId !== userId) {
      throw new Error("Forbidden: You can only publish events you organized");
    }

    this.validateStateTransition(evt.status, EventStatus.REGISTRATION_OPEN);
    evt.status = EventStatus.REGISTRATION_OPEN;
    evt.isPublished = true;
    evt.updatedAt = new Date().toISOString();

    // Dispatch notifications
    await NotificationService.sendNotification({
      userId: "demo-student-001",
      title: `Event Published: ${evt.title}`,
      message: `Registration has opened for "${evt.title}". Venue: ${evt.venue}.`,
      type: NotificationType.EVENT,
      link: `/dashboard/student/events/${evt.id}`,
    });

    return evt;
  }

  /**
   * Close registration for an event
   */
  static async closeRegistration(id: string, userId: string, userRole: Role): Promise<DemoEvent> {
    const evt = DEMO_EVENTS_STORE.find((e) => e.id === id);
    if (!evt) throw new Error("Event not found");

    if (userRole !== Role.ADMIN && evt.organizerId !== userId) {
      throw new Error("Forbidden: You can only manage events you organized");
    }

    evt.status = EventStatus.REGISTRATION_CLOSED;
    evt.updatedAt = new Date().toISOString();
    return evt;
  }

  /**
   * Archive an event
   */
  static async archiveEvent(id: string, userId: string, userRole: Role): Promise<DemoEvent> {
    const evt = DEMO_EVENTS_STORE.find((e) => e.id === id);
    if (!evt) throw new Error("Event not found");

    if (userRole !== Role.ADMIN && evt.organizerId !== userId) {
      throw new Error("Forbidden: You can only archive events you organized");
    }

    evt.status = EventStatus.ARCHIVED;
    evt.updatedAt = new Date().toISOString();
    return evt;
  }

  /**
   * Register a student for an event with atomic capacity check
   */
  static async registerForEvent(
    eventId: string,
    studentUser: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      rollNumber?: string;
      studentId?: string;
      departmentName?: string;
      semester?: number;
    }
  ): Promise<DemoEventRegistration> {
    const evt = DEMO_EVENTS_STORE.find((e) => e.id === eventId);
    if (!evt) throw new Error("Event not found");

    // Check status
    if (evt.status !== EventStatus.REGISTRATION_OPEN && evt.status !== EventStatus.PUBLISHED) {
      throw new Error(`Registration is not currently open for this event (${evt.status})`);
    }

    const now = new Date();
    if (new Date(evt.registrationDeadline) < now) {
      throw new Error("The registration deadline for this event has passed");
    }
    if (new Date(evt.registrationOpenAt) > now) {
      throw new Error("Registration has not yet opened for this event");
    }

    // Check existing active registration
    const existing = evt.registrations.find(
      (r) =>
        r.userId === studentUser.id &&
        (r.status === RegistrationStatus.REGISTERED || r.status === RegistrationStatus.ATTENDED)
    );
    if (existing) {
      throw new Error("You are already registered for this event");
    }

    // Strict Capacity Check (Concurrency safe)
    const activeCount = evt.registrations.filter(
      (r) => r.status === RegistrationStatus.REGISTERED || r.status === RegistrationStatus.ATTENDED
    ).length;

    if (activeCount >= evt.capacity) {
      throw new Error("Event capacity has been reached. No seats available.");
    }

    const confirmationCode = this.generateConfirmationCode(evt.slug);

    const newRegistration: DemoEventRegistration = {
      id: `reg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      eventId: evt.id,
      userId: studentUser.id,
      studentId: studentUser.studentId || `STU-${studentUser.id.slice(0, 6)}`,
      userName: `${studentUser.firstName} ${studentUser.lastName}`,
      userEmail: studentUser.email,
      rollNumber: studentUser.rollNumber || "22COMPA101",
      departmentName: studentUser.departmentName || "Computer Engineering",
      semester: studentUser.semester || 6,
      confirmationCode,
      registeredAt: now.toISOString(),
      status: RegistrationStatus.REGISTERED,
      attendanceStatus: EventAttendanceStatus.UNMARKED,
    };

    evt.registrations.push(newRegistration);
    evt.updatedAt = now.toISOString();

    // Send confirmation notification
    await NotificationService.sendNotification({
      userId: studentUser.id,
      title: "Event Registration Confirmed!",
      message: `You're registered for ${evt.title}. Ticket Code: ${confirmationCode}. Venue: ${evt.venue}.`,
      type: NotificationType.EVENT,
      link: `/dashboard/student/events/${evt.id}`,
    });

    return newRegistration;
  }

  /**
   * Cancel an existing event registration
   */
  static async cancelRegistration(
    eventId: string,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    const evt = DEMO_EVENTS_STORE.find((e) => e.id === eventId);
    if (!evt) throw new Error("Event not found");

    // Check if event already completed
    if (evt.status === EventStatus.COMPLETED || new Date(evt.endDateTime) < new Date()) {
      throw new Error("Cannot cancel registration for an event that has already concluded");
    }

    const regIndex = evt.registrations.findIndex(
      (r) => r.userId === userId && (r.status === RegistrationStatus.REGISTERED || r.status === RegistrationStatus.ATTENDED)
    );

    if (regIndex === -1) {
      throw new Error("No active registration found to cancel");
    }

    // Free capacity by updating status to CANCELLED
    const reg = evt.registrations[regIndex];
    reg.status = RegistrationStatus.CANCELLED;
    reg.cancelledAt = new Date().toISOString();
    evt.updatedAt = new Date().toISOString();

    // Send notification
    await NotificationService.sendNotification({
      userId,
      title: "Registration Cancelled",
      message: `Your registration for "${evt.title}" has been cancelled.`,
      type: NotificationType.EVENT,
      link: `/dashboard/student/events/${evt.id}`,
    });

    return { success: true, message: "Registration cancelled successfully" };
  }

  /**
   * Get participant roster for an organizer/admin
   */
  static async getParticipants(
    eventId: string,
    userId: string,
    userRole: Role,
    query?: {
      search?: string;
      status?: RegistrationStatus;
      attendanceStatus?: EventAttendanceStatus;
    }
  ): Promise<{ participants: DemoEventRegistration[]; total: number }> {
    const evt = DEMO_EVENTS_STORE.find((e) => e.id === eventId);
    if (!evt) throw new Error("Event not found");

    if (userRole !== Role.ADMIN && evt.organizerId !== userId) {
      throw new Error("Forbidden: You are not authorized to view the participant roster for this event");
    }

    let list = [...evt.registrations];

    if (query?.search && query.search.trim()) {
      const q = query.search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.userName.toLowerCase().includes(q) ||
          p.rollNumber.toLowerCase().includes(q) ||
          p.userEmail.toLowerCase().includes(q) ||
          p.confirmationCode.toLowerCase().includes(q)
      );
    }

    if (query?.status) {
      list = list.filter((p) => p.status === query.status);
    }

    if (query?.attendanceStatus) {
      list = list.filter((p) => p.attendanceStatus === query.attendanceStatus);
    }

    return { participants: list, total: list.length };
  }

  /**
   * Mark attendance for a participant
   */
  static async markAttendance(
    eventId: string,
    userIdOrRegId: string,
    attendanceStatus: EventAttendanceStatus,
    organizerUserId: string,
    organizerRole: Role
  ): Promise<DemoEventRegistration> {
    const evt = DEMO_EVENTS_STORE.find((e) => e.id === eventId);
    if (!evt) throw new Error("Event not found");

    if (organizerRole !== Role.ADMIN && evt.organizerId !== organizerUserId) {
      throw new Error("Forbidden: Only the authorized organizer or admin can record event attendance");
    }

    const reg = evt.registrations.find(
      (r) => r.id === userIdOrRegId || r.userId === userIdOrRegId
    );

    if (!reg) {
      throw new Error("Participant registration not found");
    }

    reg.attendanceStatus = attendanceStatus;
    reg.markedBy = organizerUserId;
    if (attendanceStatus === EventAttendanceStatus.PRESENT) {
      reg.status = RegistrationStatus.ATTENDED;
      reg.attendedAt = new Date().toISOString();
    } else {
      reg.status = RegistrationStatus.REGISTERED;
      reg.attendedAt = null;
    }

    evt.updatedAt = new Date().toISOString();
    return reg;
  }

  /**
   * Get accurate calculated analytics for an event
   */
  static async getEventAnalytics(
    eventId: string,
    userId: string,
    userRole: Role
  ): Promise<EventAnalytics> {
    const evt = DEMO_EVENTS_STORE.find((e) => e.id === eventId);
    if (!evt) throw new Error("Event not found");

    if (userRole !== Role.ADMIN && evt.organizerId !== userId) {
      throw new Error("Forbidden: You can only view analytics for your organized events");
    }

    const activeRegs = evt.registrations.filter(
      (r) => r.status === RegistrationStatus.REGISTERED || r.status === RegistrationStatus.ATTENDED
    );
    const totalRegistered = activeRegs.length;
    const availableSeats = Math.max(0, evt.capacity - totalRegistered);
    const registrationRate = evt.capacity > 0 ? Number(((totalRegistered / evt.capacity) * 100).toFixed(1)) : 0;

    const cancellationCount = evt.registrations.filter(
      (r) => r.status === RegistrationStatus.CANCELLED
    ).length;
    const allEver = evt.registrations.length;
    const cancellationRate = allEver > 0 ? Number(((cancellationCount / allEver) * 100).toFixed(1)) : 0;

    const attendedCount = evt.registrations.filter(
      (r) => r.attendanceStatus === EventAttendanceStatus.PRESENT
    ).length;
    const absentCount = evt.registrations.filter(
      (r) => r.attendanceStatus === EventAttendanceStatus.ABSENT
    ).length;

    const markedTotal = attendedCount + absentCount;
    const attendanceRate = markedTotal > 0
      ? Number(((attendedCount / markedTotal) * 100).toFixed(1))
      : 0;

    return {
      capacity: evt.capacity,
      totalRegistered,
      availableSeats,
      registrationRate,
      cancellationCount,
      cancellationRate,
      attendedCount,
      absentCount,
      attendanceRate,
      noShowCount: absentCount,
    };
  }

  /**
   * Get all registered events for a specific user
   */
  static async getUserRegistrations(userId: string): Promise<{
    upcoming: (DemoEvent & { registration: DemoEventRegistration })[];
    past: (DemoEvent & { registration: DemoEventRegistration })[];
  }> {
    const now = new Date();
    const upcoming: (DemoEvent & { registration: DemoEventRegistration })[] = [];
    const past: (DemoEvent & { registration: DemoEventRegistration })[] = [];

    for (const evt of DEMO_EVENTS_STORE) {
      const reg = evt.registrations.find(
        (r) =>
          r.userId === userId &&
          (r.status === RegistrationStatus.REGISTERED || r.status === RegistrationStatus.ATTENDED)
      );

      if (reg) {
        const item = { ...evt, registration: reg };
        if (new Date(evt.endDateTime) >= now && evt.status !== EventStatus.COMPLETED) {
          upcoming.push(item);
        } else {
          past.push(item);
        }
      }
    }

    upcoming.sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
    past.sort((a, b) => new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime());

    return { upcoming, past };
  }

  /**
   * Get organizer events summary (KPIs)
   */
  static async getOrganizerSummary(userId: string, userRole: Role): Promise<{
    activeEventsCount: number;
    totalRegistrationsCount: number;
    totalSeatsAvailable: number;
    averageAttendanceRate: number;
  }> {
    let events = DEMO_EVENTS_STORE;
    if (userRole !== Role.ADMIN) {
      events = events.filter((e) => e.organizerId === userId);
    }

    const activeEvents = events.filter(
      (e) => e.status === EventStatus.REGISTRATION_OPEN || e.status === EventStatus.PUBLISHED
    );

    let totalRegs = 0;
    let totalSeatsAvail = 0;
    let sumAttendanceRate = 0;
    let eventsWithAttendance = 0;

    for (const evt of events) {
      const active = evt.registrations.filter(
        (r) => r.status === RegistrationStatus.REGISTERED || r.status === RegistrationStatus.ATTENDED
      );
      totalRegs += active.length;
      totalSeatsAvail += Math.max(0, evt.capacity - active.length);

      const attended = evt.registrations.filter((r) => r.attendanceStatus === EventAttendanceStatus.PRESENT).length;
      const absent = evt.registrations.filter((r) => r.attendanceStatus === EventAttendanceStatus.ABSENT).length;
      if (attended + absent > 0) {
        sumAttendanceRate += (attended / (attended + absent)) * 100;
        eventsWithAttendance++;
      }
    }

    const avgRate = eventsWithAttendance > 0 ? Number((sumAttendanceRate / eventsWithAttendance).toFixed(1)) : 85.0;

    return {
      activeEventsCount: activeEvents.length,
      totalRegistrationsCount: totalRegs,
      totalSeatsAvailable: totalSeatsAvail,
      averageAttendanceRate: avgRate,
    };
  }
}
