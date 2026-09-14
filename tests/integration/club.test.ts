import { describe, it, expect, beforeEach } from "vitest";
import { ClubService } from "@/services/club.service";
import {
  createClubSchema,
  updateClubSchema,
  createActivitySchema,
} from "@/validators/club.schema";
import {
  ClubCategory,
  ClubStatus,
  MembershipRole,
  MembershipStatus,
  ClubActivityType,
  Role,
} from "@prisma/client";
import {
  resetDemoClubsStore,
  DEMO_CLUBS_STORE,
} from "@/lib/club/demo-clubs";

describe("Phase 9 — Club Management, Membership & Coordinator Workflows Tests", () => {
  beforeEach(() => {
    resetDemoClubsStore();
  });

  // =========================================================================
  // 1. UNIT TESTS: VALIDATION, CATEGORIES & ENGAGEMENT SCORING
  // =========================================================================
  describe("Club Validation, Categories & Algorithm Integrity", () => {
    it("1. validates valid club creation payload", () => {
      const payload = {
        name: "Artificial Intelligence Society",
        description: "Focusing on large language models and autonomous agent reasoning frameworks.",
        category: ClubCategory.TECHNICAL,
        shortDescription: "Exploring modern deep learning architectures.",
        establishedYear: 2024,
      };

      const result = createClubSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("2. rejects club with name shorter than 3 characters", () => {
      const payload = {
        name: "AI",
        description: "Valid description for short name test.",
        category: ClubCategory.TECHNICAL,
      };

      const result = createClubSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.name).toBeDefined();
      }
    });

    it("3. rejects club with description shorter than 10 characters", () => {
      const payload = {
        name: "Valid Robotics Club",
        description: "Short",
        category: ClubCategory.ROBOTICS,
      };

      const result = createClubSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.description).toBeDefined();
      }
    });

    it("4. rejects invalid club category", () => {
      const payload = {
        name: "Valid Club Name",
        description: "Valid long description for category test.",
        category: "INVALID_CAT" as any,
      };

      const result = createClubSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("5. validates activity creation payload", () => {
      const payload = {
        title: "Autonomous Quadcopter Workshop",
        description: "Hands-on flight controller programming and PID loop tuning.",
        activityDate: "2026-10-15T15:00:00.000Z",
        activityType: ClubActivityType.WORKSHOP,
        venue: "Lab 301",
      };

      const result = createActivitySchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("6. rejects activity with invalid date string", () => {
      const payload = {
        title: "Invalid Date Activity",
        description: "Valid description for activity.",
        activityDate: "not-a-date",
        activityType: ClubActivityType.MEETING,
      };

      const result = createActivitySchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("7. generates clean alphanumeric slug from club name", () => {
      const slug = ClubService.slugify("Coding & Robotics Club (2026)");
      expect(slug).toBe("coding-robotics-club-2026");
    });

    it("8. calculates transparent engagement score and assigns appropriate tier", () => {
      const sampleClub = DEMO_CLUBS_STORE.find((c) => c.id === "club-001")!;
      const { score, tier } = ClubService.calculateEngagementScore(sampleClub);

      expect(typeof score).toBe("number");
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
      expect(["Elite", "High", "Active", "Developing"]).toContain(tier);
    });
  });

  // =========================================================================
  // 2. LIFECYCLE, VISIBILITY & DISCOVERY FEED
  // =========================================================================
  describe("Club Lifecycle & Student Discovery", () => {
    it("9. strictly hides DRAFT clubs from student discovery feed", async () => {
      const { clubs } = await ClubService.getClubs({
        role: Role.STUDENT,
        userId: "demo-student-001",
      });

      const draftClub = clubs.find((c) => c.status === ClubStatus.DRAFT);
      expect(draftClub).toBeUndefined();
    });

    it("10. allows ADMIN to discover DRAFT clubs", async () => {
      const { clubs } = await ClubService.getClubs({
        role: Role.ADMIN,
        userId: "demo-admin-001",
      });

      const draftClub = clubs.find((c) => c.status === ClubStatus.DRAFT);
      expect(draftClub).toBeDefined();
    });

    it("11. filters clubs by category", async () => {
      const { clubs } = await ClubService.getClubs({
        role: Role.STUDENT,
        category: ClubCategory.TECHNICAL,
      });

      expect(clubs.length).toBeGreaterThan(0);
      expect(clubs.every((c) => c.category === ClubCategory.TECHNICAL)).toBe(true);
    });

    it("12. searches clubs by keyword in name or description", async () => {
      const { clubs } = await ClubService.getClubs({
        role: Role.STUDENT,
        search: "Robotics",
      });

      expect(clubs.length).toBeGreaterThan(0);
      expect(
        clubs.some((c) => c.name.toLowerCase().includes("robotics") || c.description.toLowerCase().includes("robotics"))
      ).toBe(true);
    });

    it("13. sorts clubs by most active (engagement score)", async () => {
      const { clubs } = await ClubService.getClubs({
        role: Role.STUDENT,
        sort: "most_active",
      });

      for (let i = 0; i < clubs.length - 1; i++) {
        expect(clubs[i].engagementScore).toBeGreaterThanOrEqual(clubs[i + 1].engagementScore);
      }
    });

    it("14. retrieves single club detail with linked Phase 8 events and activities", async () => {
      const club = await ClubService.getClubById("club-001", "demo-student-001", Role.STUDENT);
      expect(club).toBeDefined();
      expect(club.name).toBe("Coding & Robotics Club");
      expect(club.memberCount).toBeGreaterThan(0);
      expect(Array.isArray(club.upcomingEvents)).toBe(true);
      expect(Array.isArray(club.activities)).toBe(true);
    });

    it("15. returns null when student attempts to open DRAFT club directly", async () => {
      const draftClub = DEMO_CLUBS_STORE.find((c) => c.status === ClubStatus.DRAFT)!;
      const result = await ClubService.getClubById(draftClub.id, "demo-student-001", Role.STUDENT);
      expect(result).toBeNull();
    });
  });

  // =========================================================================
  // 3. MEMBERSHIP WORKFLOWS & APPROVALS
  // =========================================================================
  describe("Membership Requests, Approvals & Life Cycle", () => {
    it("16. allows student to submit join request creating PENDING membership", async () => {
      const newStudent = {
        id: "new-student-test-01",
        email: "new.student@campussphere.edu",
        firstName: "Kavya",
        lastName: "Patel",
        studentId: "STU-2024-0501",
        rollNumber: "24COMPA501",
        departmentName: "Computer Engineering",
        semester: 2,
      };

      const membership = await ClubService.requestMembership(
        "club-003",
        newStudent,
        "I am passionate about product design and Figma prototyping."
      );

      expect(membership.status).toBe(MembershipStatus.PENDING);
      expect(membership.userId).toBe(newStudent.id);
      expect(membership.clubId).toBe("club-003");

      const club = await ClubService.getClubById("club-003");
      expect(club.pendingCount).toBeGreaterThan(0);
    });

    it("17. prevents duplicate membership application by same student", async () => {
      const student = {
        id: "demo-student-001",
        email: "student@campussphere.edu",
        firstName: "Aarav",
        lastName: "Mehta",
      };

      // demo-student-001 is already an active member of club-001
      await expect(
        ClubService.requestMembership("club-001", student)
      ).rejects.toThrow(/already an active member/);
    });

    it("18. rejects join request if club is currently SUSPENDED", async () => {
      const suspendedClub = DEMO_CLUBS_STORE.find((c) => c.status === ClubStatus.SUSPENDED)!;
      const student = {
        id: "test-stu-09",
        email: "test09@campussphere.edu",
        firstName: "Test",
        lastName: "Student",
      };

      await expect(
        ClubService.requestMembership(suspendedClub.id, student)
      ).rejects.toThrow(/currently suspended/);
    });

    it("19. coordinator approves pending request transitioning status to ACTIVE", async () => {
      const pendingMem = DEMO_CLUBS_STORE.find((c) => c.id === "club-001")!.memberships.find(
        (m) => m.status === MembershipStatus.PENDING
      )!;

      const approved = await ClubService.approveMembership(
        "club-001",
        pendingMem.id,
        "demo-club-001",
        Role.CLUB_COORDINATOR
      );

      expect(approved.status).toBe(MembershipStatus.ACTIVE);
      expect(approved.approvedAt).toBeDefined();
      expect(approved.approvedBy).toBe("demo-club-001");
    });

    it("20. coordinator rejects pending request transitioning status to REJECTED", async () => {
      const pendingMem = DEMO_CLUBS_STORE.find((c) => c.id === "club-001")!.memberships.find(
        (m) => m.status === MembershipStatus.PENDING
      )!;

      const rejected = await ClubService.rejectMembership(
        "club-001",
        pendingMem.id,
        "demo-club-001",
        Role.CLUB_COORDINATOR
      );

      expect(rejected.status).toBe(MembershipStatus.REJECTED);
    });

    it("21. student leaves active club transitioning status to LEFT", async () => {
      // demo-student-001 is in club-001
      const result = await ClubService.leaveClub("club-001", "demo-student-001");
      expect(result.success).toBe(true);

      const club = await ClubService.getClubById("club-001", "demo-student-001", Role.STUDENT);
      const userMem = club.userMembership;
      expect(userMem).toBeNull();
    });

    it("22. coordinator promotes member role to CORE_MEMBER", async () => {
      const member = DEMO_CLUBS_STORE.find((c) => c.id === "club-001")!.memberships.find(
        (m) => m.role === MembershipRole.MEMBER && m.status === MembershipStatus.ACTIVE
      )!;

      const updated = await ClubService.updateMemberRole(
        "club-001",
        member.id,
        MembershipRole.CORE_MEMBER,
        "demo-club-001",
        Role.CLUB_COORDINATOR
      );

      expect(updated.role).toBe(MembershipRole.CORE_MEMBER);
    });

    it("23. coordinator removes member from active roster", async () => {
      const member = DEMO_CLUBS_STORE.find((c) => c.id === "club-001")!.memberships.find(
        (m) => m.role === MembershipRole.MEMBER && m.status === MembershipStatus.ACTIVE
      )!;

      const removed = await ClubService.removeMember(
        "club-001",
        member.id,
        "demo-club-001",
        Role.CLUB_COORDINATOR
      );

      expect(removed.status).toBe(MembershipStatus.LEFT);
    });
  });

  // =========================================================================
  // 4. ACTIVITIES, EVENTS & TELEMETRY
  // =========================================================================
  describe("Activities Management & Engagement Telemetry", () => {
    it("24. coordinator schedules new activity for club", async () => {
      const newActivity = await ClubService.createActivity(
        "club-001",
        {
          title: "Robotics Hardware Debugging & Soldering Masterclass",
          description: "Hands-on session assembling motor drivers and breadboards.",
          activityDate: "2026-10-20T16:00:00.000Z",
          activityType: ClubActivityType.WORKSHOP,
          venue: "Robotics Lab Block A",
        },
        "demo-club-001",
        Role.CLUB_COORDINATOR
      );

      expect(newActivity.id).toBeDefined();
      expect(newActivity.title).toContain("Robotics Hardware");

      const club = await ClubService.getClubById("club-001");
      const found = club.activities.find((a: any) => a.id === newActivity.id);
      expect(found).toBeDefined();
    });

    it("25. coordinator deletes a club activity", async () => {
      const club = DEMO_CLUBS_STORE.find((c) => c.id === "club-001")!;
      const actId = club.activities[0].id;

      const result = await ClubService.deleteActivity("club-001", actId, "demo-club-001", Role.CLUB_COORDINATOR);
      expect(result.success).toBe(true);

      const after = await ClubService.getClubById("club-001");
      expect(after.activities.find((a: any) => a.id === actId)).toBeUndefined();
    });

    it("26. retrieves club analytics telemetry with member and event counts", async () => {
      const telemetry = await ClubService.getClubAnalytics(
        "club-001",
        "demo-club-001",
        Role.CLUB_COORDINATOR
      );

      expect(telemetry.clubId).toBe("club-001");
      expect(typeof telemetry.totalMembers).toBe("number");
      expect(typeof telemetry.pendingRequests).toBe("number");
      expect(typeof telemetry.engagementScore).toBe("number");
      expect(typeof telemetry.activeEventsCount).toBe("number");
    });

    it("27. fetches user clubs categorizing active, pending, and past memberships", async () => {
      const { active, pending } = await ClubService.getUserClubs("demo-student-001");

      expect(Array.isArray(active)).toBe(true);
      expect(Array.isArray(pending)).toBe(true);
      // demo-student-001 is active in club-001 and pending in club-002
      expect(active.some((c) => c.id === "club-001")).toBe(true);
      expect(pending.some((c) => c.id === "club-002")).toBe(true);
    });
  });

  // =========================================================================
  // 5. SECURITY & RBAC BOUNDARIES
  // =========================================================================
  describe("Security & Role-Based Access Enforcement", () => {
    it("28. blocks student from creating a new club", async () => {
      await expect(
        ClubService.createClub(
          {
            name: "Unauthorized Hacker Society",
            description: "Students trying to create clubs without admin approval.",
            category: ClubCategory.TECHNICAL,
          },
          "demo-student-001",
          Role.STUDENT
        )
      ).rejects.toThrow(/Forbidden/);
    });

    it("29. blocks student from approving a club membership", async () => {
      await expect(
        ClubService.approveMembership(
          "club-001",
          "mem-001-05",
          "demo-student-001",
          Role.STUDENT
        )
      ).rejects.toThrow(/Forbidden/);
    });

    it("30. blocks non-assigned coordinator from approving members of unrelated club", async () => {
      // demo-club-001 is coordinator of club-001, not club-003
      const memInClub3 = DEMO_CLUBS_STORE.find((c) => c.id === "club-003")!.memberships[0];

      await expect(
        ClubService.approveMembership(
          "club-003",
          memInClub3.id,
          "demo-club-001",
          Role.CLUB_COORDINATOR
        )
      ).rejects.toThrow(/Forbidden/);
    });

    it("31. blocks coordinator from suspending or archiving a club", async () => {
      await expect(
        ClubService.updateClub(
          "club-001",
          { status: ClubStatus.SUSPENDED },
          "demo-club-001",
          Role.CLUB_COORDINATOR
        )
      ).rejects.toThrow(/Only administrators/);
    });

    it("32. admin has universal management access across all clubs", async () => {
      const telemetry = await ClubService.getClubAnalytics(
        "club-001",
        "demo-admin-001",
        Role.ADMIN
      );

      expect(telemetry.clubId).toBe("club-001");
      expect(telemetry.engagementScore).toBeGreaterThanOrEqual(0);
    });

    it("33. admin publishes a draft club transitioning it to ACTIVE", async () => {
      const draftClub = DEMO_CLUBS_STORE.find((c) => c.status === ClubStatus.DRAFT)!;
      const published = await ClubService.publishClub(draftClub.id, "demo-admin-001");

      expect(published.status).toBe(ClubStatus.ACTIVE);

      // Now student can discover it
      const { clubs } = await ClubService.getClubs({
        role: Role.STUDENT,
        userId: "demo-student-001",
      });
      expect(clubs.some((c) => c.id === draftClub.id)).toBe(true);
    });
  });
});
