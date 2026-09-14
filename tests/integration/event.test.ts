import { describe, it, expect, beforeEach } from "vitest";
import { EventService } from "@/services/event.service";
import {
  createEventSchema,
  updateEventSchema,
  markAttendanceSchema,
} from "@/validators/event.schema";
import {
  EventCategory,
  EventStatus,
  EventAttendanceStatus,
  RegistrationStatus,
  Role,
} from "@prisma/client";
import {
  resetDemoEventsStore,
  DEMO_EVENTS_STORE,
} from "@/lib/event/demo-events";
import { generateICS } from "@/lib/event/ics-generator";

describe("Phase 8 — Events Discovery, Capacity Management & Registration System Tests", () => {
  beforeEach(() => {
    resetDemoEventsStore();
  });

  // =========================================================================
  // 1. UNIT TESTS: VALIDATION & CATEGORY INTEGRITY
  // =========================================================================
  describe("Event Validation & Category Integrity", () => {
    it("1. should validate correct event creation payload", () => {
      const payload = {
        title: "Introduction to Generative AI & Autonomous Agents",
        summary: "Hands-on engineering workshop on agentic architectures.",
        description: "Comprehensive laboratory session exploring LLMs, agent tool use, and memory caching.",
        category: EventCategory.WORKSHOP,
        venue: "Lab 301, Advanced Computing Wing",
        startDateTime: "2026-10-10T10:00:00.000Z",
        endDateTime: "2026-10-10T14:00:00.000Z",
        registrationDeadline: "2026-10-09T23:59:59.000Z",
        capacity: 45,
      };

      const result = createEventSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("2. should reject event with title shorter than 3 characters", () => {
      const payload = {
        title: "AI",
        description: "Valid long description for this testing workshop.",
        category: EventCategory.SEMINAR,
        venue: "Main Hall",
        startDateTime: "2026-10-10T10:00:00.000Z",
        endDateTime: "2026-10-10T14:00:00.000Z",
        registrationDeadline: "2026-10-09T23:59:59.000Z",
        capacity: 30,
      };

      const result = createEventSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.title).toBeDefined();
      }
    });

    it("3. should reject event with description shorter than 10 characters", () => {
      const payload = {
        title: "Valid Workshop Title",
        description: "Short",
        category: EventCategory.TECHNICAL,
        venue: "Hall 2",
        startDateTime: "2026-10-10T10:00:00.000Z",
        endDateTime: "2026-10-10T14:00:00.000Z",
        registrationDeadline: "2026-10-09T23:59:59.000Z",
        capacity: 20,
      };

      const result = createEventSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.description).toBeDefined();
      }
    });

    it("4. should reject event where endDateTime is before startDateTime", () => {
      const payload = {
        title: "Chronology Inverted Event",
        description: "Valid description for chronology test.",
        category: EventCategory.COMPETITION,
        venue: "Terminal Cluster 1",
        startDateTime: "2026-10-10T14:00:00.000Z",
        endDateTime: "2026-10-10T10:00:00.000Z", // Earlier than start
        registrationDeadline: "2026-10-09T20:00:00.000Z",
        capacity: 25,
      };

      const result = createEventSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.endDateTime).toBeDefined();
      }
    });

    it("5. should reject event where registrationDeadline is after endDateTime", () => {
      const payload = {
        title: "Late Deadline Event",
        description: "Valid description for deadline test.",
        category: EventCategory.SPORTS,
        venue: "Grounds",
        startDateTime: "2026-10-10T10:00:00.000Z",
        endDateTime: "2026-10-10T14:00:00.000Z",
        registrationDeadline: "2026-10-11T10:00:00.000Z", // After event ends
        capacity: 50,
      };

      const result = createEventSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.registrationDeadline).toBeDefined();
      }
    });

    it("6. should reject event with capacity less than 1", () => {
      const payload = {
        title: "Zero Capacity Event",
        description: "Valid description for capacity test.",
        category: EventCategory.WORKSHOP,
        venue: "Lab 1",
        startDateTime: "2026-10-10T10:00:00.000Z",
        endDateTime: "2026-10-10T12:00:00.000Z",
        registrationDeadline: "2026-10-09T20:00:00.000Z",
        capacity: 0,
      };

      const result = createEventSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("7. should support all standard institutional event categories", () => {
      const categories = [
        EventCategory.WORKSHOP,
        EventCategory.SEMINAR,
        EventCategory.HACKATHON,
        EventCategory.CULTURAL,
        EventCategory.SPORTS,
        EventCategory.CLUB,
        EventCategory.PLACEMENT,
        EventCategory.TECHNICAL,
        EventCategory.COMPETITION,
        EventCategory.WEBINAR,
        EventCategory.OTHER,
      ];

      for (const cat of categories) {
        const payload = {
          title: `Annual ${cat} Event`,
          description: `Detailed description for ${cat} event session.`,
          category: cat,
          venue: "Main University Campus",
          startDateTime: "2026-10-10T09:00:00.000Z",
          endDateTime: "2026-10-10T17:00:00.000Z",
          registrationDeadline: "2026-10-09T18:00:00.000Z",
          capacity: 50,
        };
        const result = createEventSchema.safeParse(payload);
        expect(result.success).toBe(true);
      }
    });
  });

  // =========================================================================
  // 2. LIFECYCLE, STATE TRANSITIONS & VISIBILITY
  // =========================================================================
  describe("Event Lifecycle, State Transitions & Visibility", () => {
    it("8. allows faculty to author a DRAFT event", async () => {
      const event = await EventService.createEvent(
        {
          title: "Quantum Algorithms Faculty Draft",
          summary: "Internal faculty draft proposal.",
          description: "Full research proposal syllabus and workshop track layout.",
          category: EventCategory.SEMINAR,
          venue: "Physics Lab 2",
          startDateTime: "2026-11-15T10:00:00.000Z",
          endDateTime: "2026-11-15T13:00:00.000Z",
          registrationDeadline: "2026-11-14T20:00:00.000Z",
          capacity: 30,
          status: EventStatus.DRAFT,
        },
        {
          id: "demo-faculty-001",
          role: Role.FACULTY,
          firstName: "Meera",
          lastName: "Sen",
        }
      );

      expect(event.id).toBeDefined();
      expect(event.status).toBe(EventStatus.DRAFT);
      expect(event.isPublished).toBe(false);
    });

    it("9. draft events are strictly invisible to students during discovery", async () => {
      const studentFeed = await EventService.getEvents({
        userId: "demo-student-001",
        role: Role.STUDENT,
      });

      const draftFound = studentFeed.events.some((e) => e.status === EventStatus.DRAFT);
      expect(draftFound).toBe(false);

      // Attempting direct detail lookup for a draft event returns null for students
      const draftDetail = await EventService.getEventById("evt-014", "demo-student-001", Role.STUDENT);
      expect(draftDetail).toBeNull();
    });

    it("10. authoring faculty and admins can view their own drafts", async () => {
      const facultyDetail = await EventService.getEventById("evt-014", "demo-faculty-001", Role.FACULTY);
      expect(facultyDetail).not.toBeNull();
      expect(facultyDetail?.status).toBe(EventStatus.DRAFT);

      const adminDetail = await EventService.getEventById("evt-014", "demo-admin-001", Role.ADMIN);
      expect(adminDetail).not.toBeNull();
    });

    it("11. publishing a draft transitions it to REGISTRATION_OPEN and makes it discoverable", async () => {
      const published = await EventService.publishEvent("evt-014", "demo-faculty-001", Role.FACULTY);
      expect(published.status).toBe(EventStatus.REGISTRATION_OPEN);
      expect(published.isPublished).toBe(true);

      // Now student can discover it
      const studentLookup = await EventService.getEventById("evt-014", "demo-student-001", Role.STUDENT);
      expect(studentLookup).not.toBeNull();
      expect(studentLookup?.title).toContain("Advanced LLM Prompt Engineering");
    });

    it("12. allows authorized closing of registrations", async () => {
      const closed = await EventService.closeRegistration("evt-001", "demo-club-001", Role.CLUB_COORDINATOR);
      expect(closed.status).toBe(EventStatus.REGISTRATION_CLOSED);
    });

    it("13. rejects invalid state transitions on archived events", () => {
      expect(() => {
        EventService.validateStateTransition(EventStatus.ARCHIVED, EventStatus.REGISTRATION_OPEN);
      }).toThrow(/Archived events cannot change status/);
    });

    it("14. rejects reopening registration for completed events", () => {
      expect(() => {
        EventService.validateStateTransition(EventStatus.COMPLETED, EventStatus.REGISTRATION_OPEN);
      }).toThrow(/Completed events cannot reopen registration/);
    });
  });

  // =========================================================================
  // 3. REGISTRATION, CAPACITY CONCURRENCY & CANCELLATION
  // =========================================================================
  describe("Registration, Capacity Concurrency & Seat Restoration", () => {
    it("15. student successfully registers and receives formatted confirmation code", async () => {
      const registration = await EventService.registerForEvent("evt-005", {
        id: "demo-student-001",
        email: "student@campussphere.edu",
        firstName: "Aarav",
        lastName: "Mehta",
        rollNumber: "22COMPA101",
        departmentName: "Computer Engineering",
        semester: 6,
      });

      expect(registration.id).toBeDefined();
      expect(registration.status).toBe(RegistrationStatus.REGISTERED);
      expect(registration.confirmationCode).toMatch(/^CS-[A-Z0-9]+-[A-Z0-9]+$/);
    });

    it("16. prevents duplicate registrations for the same event", async () => {
      // Student already registered in demo data for evt-001
      await expect(
        EventService.registerForEvent("evt-001", {
          id: "demo-student-001",
          email: "student@campussphere.edu",
          firstName: "Aarav",
          lastName: "Mehta",
        })
      ).rejects.toThrow(/already registered/);
    });

    it("17. rejects registration when event deadline has passed", async () => {
      const pastDeadlineEvent = await EventService.createEvent(
        {
          title: "Past Deadline Test Workshop",
          summary: "Testing passed deadline.",
          description: "Testing registration deadline enforcement specifically.",
          category: EventCategory.WORKSHOP,
          venue: "Room 101",
          startDateTime: new Date(Date.now() + 86400000).toISOString(),
          endDateTime: new Date(Date.now() + 86400000 + 7200000).toISOString(),
          registrationDeadline: new Date(Date.now() - 60000).toISOString(),
          capacity: 20,
          status: EventStatus.REGISTRATION_OPEN,
        },
        {
          id: "demo-admin-001",
          role: Role.ADMIN,
          firstName: "Dr. Rajeshwar",
          lastName: "Sharma",
        }
      );

      await expect(
        EventService.registerForEvent(pastDeadlineEvent.id, {
          id: "demo-student-005",
          email: "student5@campussphere.edu",
          firstName: "Vikram",
          lastName: "Rao",
        })
      ).rejects.toThrow(/deadline/);
    });

    it("18. concurrency test: exactly 1 succeeds when 2 users register for final available seat (capacity=1)", async () => {
      // Create a test event with capacity = 1
      const singleSeatEvent = await EventService.createEvent(
        {
          title: "Exclusive Final Seat Masterclass",
          summary: "Single seat capacity test.",
          description: "Testing concurrency race conditions on final remaining seat.",
          category: EventCategory.WORKSHOP,
          venue: "Executive Suite",
          startDateTime: "2026-11-20T10:00:00.000Z",
          endDateTime: "2026-11-20T13:00:00.000Z",
          registrationDeadline: "2026-11-19T20:00:00.000Z",
          capacity: 1,
          status: EventStatus.REGISTRATION_OPEN,
        },
        {
          id: "demo-admin-001",
          role: Role.ADMIN,
          firstName: "Dr. Rajeshwar",
          lastName: "Sharma",
        }
      );

      expect(singleSeatEvent.capacity).toBe(1);

      // Two students attempt registration concurrently
      const userA = {
        id: "user-concurrent-A",
        email: "userA@campussphere.edu",
        firstName: "User",
        lastName: "Alpha",
      };
      const userB = {
        id: "user-concurrent-B",
        email: "userB@campussphere.edu",
        firstName: "User",
        lastName: "Beta",
      };

      const results = await Promise.allSettled([
        EventService.registerForEvent(singleSeatEvent.id, userA),
        EventService.registerForEvent(singleSeatEvent.id, userB),
      ]);

      const fulfilled = results.filter((r) => r.status === "fulfilled");
      const rejected = results.filter((r) => r.status === "rejected");

      // Exactly 1 must succeed and exactly 1 must fail with capacity error
      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);

      const rejectedReason = (rejected[0] as PromiseRejectedResult).reason;
      expect(rejectedReason.message).toMatch(/capacity has been reached/);

      // Seats remaining should now be 0
      const remaining = EventService.calculateSeatsRemaining(singleSeatEvent);
      expect(remaining).toBe(0);
    });

    it("19. rejects registration when event capacity is full (evt-011)", async () => {
      // evt-011 has capacity: 10, registered: 10
      await expect(
        EventService.registerForEvent("evt-011", {
          id: "demo-student-001",
          email: "student@campussphere.edu",
          firstName: "Aarav",
          lastName: "Mehta",
        })
      ).rejects.toThrow(/capacity has been reached/);
    });

    it("20. cancelling registration frees up capacity and marks status CANCELLED", async () => {
      const evt = DEMO_EVENTS_STORE.find((e) => e.id === "evt-001")!;
      const initialRemaining = EventService.calculateSeatsRemaining(evt);

      // Student cancels registration
      const result = await EventService.cancelRegistration("evt-001", "demo-student-001");
      expect(result.success).toBe(true);

      const newRemaining = EventService.calculateSeatsRemaining(evt);
      expect(newRemaining).toBe(initialRemaining + 1);

      const studentReg = evt.registrations.find((r) => r.userId === "demo-student-001");
      expect(studentReg?.status).toBe(RegistrationStatus.CANCELLED);
      expect(studentReg?.cancelledAt).toBeDefined();
    });

    it("21. rejects cancellation if event is completed", async () => {
      await expect(
        EventService.cancelRegistration("evt-013", "demo-student-001")
      ).rejects.toThrow(/already concluded/);
    });

    it("22. a new student can claim a seat freed by cancellation", async () => {
      // evt-011 was full (10/10). Cancel user-lead-1
      await EventService.cancelRegistration("evt-011", "user-lead-1");

      const evt = DEMO_EVENTS_STORE.find((e) => e.id === "evt-011")!;
      expect(EventService.calculateSeatsRemaining(evt)).toBe(1);

      // Now student can register
      const newReg = await EventService.registerForEvent("evt-011", {
        id: "demo-student-001",
        email: "student@campussphere.edu",
        firstName: "Aarav",
        lastName: "Mehta",
      });

      expect(newReg.status).toBe(RegistrationStatus.REGISTERED);
      expect(EventService.calculateSeatsRemaining(evt)).toBe(0);
    });
  });

  // =========================================================================
  // 4. PARTICIPANT MANAGEMENT & EVENT ATTENDANCE
  // =========================================================================
  describe("Participant Management & Event Attendance Tracking", () => {
    it("23. organizer retrieves participant roster with complete student metadata", async () => {
      const { participants, total } = await EventService.getParticipants(
        "evt-001",
        "demo-club-001",
        Role.CLUB_COORDINATOR
      );

      expect(total).toBeGreaterThan(0);
      expect(participants[0].userName).toBeDefined();
      expect(participants[0].confirmationCode).toBeDefined();
    });

    it("24. filters participants by search query and registration status", async () => {
      const { participants } = await EventService.getParticipants(
        "evt-001",
        "demo-club-001",
        Role.CLUB_COORDINATOR,
        { search: "Priya" }
      );

      expect(participants.length).toBe(1);
      expect(participants[0].userName).toBe("Priya Nair");
    });

    it("25. organizer marks participant attendance as PRESENT with timestamp and markedBy", async () => {
      const updated = await EventService.markAttendance(
        "evt-002",
        "demo-student-001",
        EventAttendanceStatus.PRESENT,
        "demo-faculty-001",
        Role.FACULTY
      );

      expect(updated.attendanceStatus).toBe(EventAttendanceStatus.PRESENT);
      expect(updated.status).toBe(RegistrationStatus.ATTENDED);
      expect(updated.attendedAt).toBeDefined();
      expect(updated.markedBy).toBe("demo-faculty-001");
    });

    it("26. marking attendance as ABSENT records status without ATTENDED status", async () => {
      const updated = await EventService.markAttendance(
        "evt-002",
        "demo-student-001",
        EventAttendanceStatus.ABSENT,
        "demo-faculty-001",
        Role.FACULTY
      );

      expect(updated.attendanceStatus).toBe(EventAttendanceStatus.ABSENT);
      expect(updated.status).toBe(RegistrationStatus.REGISTERED);
    });
  });

  // =========================================================================
  // 5. REAL-TIME ANALYTICS & CALENDAR EXPORT
  // =========================================================================
  describe("Real-time Analytics & RFC 5545 iCalendar Export", () => {
    it("27. calculates real-time event analytics accurately", async () => {
      const analytics = await EventService.getEventAnalytics(
        "evt-013",
        "demo-faculty-001",
        Role.FACULTY
      );

      expect(analytics.capacity).toBe(30);
      expect(analytics.totalRegistered).toBeGreaterThan(0);
      expect(analytics.attendedCount).toBe(2);
      expect(analytics.absentCount).toBe(1);
      expect(analytics.attendanceRate).toBe(66.7); // 2 out of 3 = 66.7%
    });

    it("28. returns organizer summary across multiple events", async () => {
      const summary = await EventService.getOrganizerSummary(
        "demo-faculty-001",
        Role.FACULTY
      );

      expect(summary.activeEventsCount).toBeGreaterThanOrEqual(0);
      expect(summary.totalRegistrationsCount).toBeGreaterThan(0);
      expect(typeof summary.averageAttendanceRate).toBe("number");
    });

    it("29. generates valid RFC 5545 .ics iCalendar export", () => {
      const ics = generateICS({
        id: "evt-test-01",
        title: "National Hackathon 2026",
        description: "Annual hackathon competition on campus.",
        summary: "36 hour hackathon.",
        venue: "Auditorium A",
        startDateTime: "2026-10-15T09:00:00.000Z",
        endDateTime: "2026-10-16T21:00:00.000Z",
        organizerName: "Ananya Deshmukh",
      });

      expect(ics).toContain("BEGIN:VCALENDAR");
      expect(ics).toContain("BEGIN:VEVENT");
      expect(ics).toContain("SUMMARY:National Hackathon 2026");
      expect(ics).toContain("LOCATION:Auditorium A");
      expect(ics).toContain("UID:event-evt-test-01@campussphere.edu");
      expect(ics).toContain("END:VEVENT");
      expect(ics).toContain("END:VCALENDAR");
    });
  });

  // =========================================================================
  // 6. RBAC & SECURITY BOUNDARIES
  // =========================================================================
  describe("RBAC & Security Boundaries", () => {
    it("30. student cannot view participant roster (throws forbidden error)", async () => {
      await expect(
        EventService.getParticipants("evt-001", "demo-student-001", Role.STUDENT)
      ).rejects.toThrow(/Forbidden/);
    });

    it("31. faculty member cannot edit another organizer's event", async () => {
      // evt-001 is organized by demo-club-001
      await expect(
        EventService.updateEvent("evt-001", { title: "Hijacked Title" }, "demo-faculty-001", Role.FACULTY)
      ).rejects.toThrow(/Forbidden/);
    });

    it("32. non-organizer faculty member cannot mark attendance for another organizer's event", async () => {
      await expect(
        EventService.markAttendance(
          "evt-001",
          "demo-student-001",
          EventAttendanceStatus.PRESENT,
          "demo-faculty-001",
          Role.FACULTY
        )
      ).rejects.toThrow(/Forbidden/);
    });

    it("33. admin has universal governance across all events", async () => {
      const adminAnalytics = await EventService.getEventAnalytics(
        "evt-001",
        "demo-admin-001",
        Role.ADMIN
      );
      expect(adminAnalytics).toBeDefined();

      const participants = await EventService.getParticipants(
        "evt-001",
        "demo-admin-001",
        Role.ADMIN
      );
      expect(participants.total).toBeGreaterThanOrEqual(0);
    });
  });
});
