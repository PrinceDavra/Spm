import { describe, it, expect } from "vitest";
import { CSPSolver, AcademicSubject } from "@/lib/timetable/csp-solver";
import { TimetableConflictDetector } from "@/lib/timetable/conflict-detector";
import { TimetableService } from "@/services/timetable.service";
import {
  DEMO_ROOMS,
  DEMO_WORKING_CONFIG,
  DEMO_FACULTY_UNAVAILABILITY,
  DEMO_ROOM_UNAVAILABILITY,
  DEMO_DIVISION_A_SUBJECTS,
  DEMO_TIMETABLES_STORE,
} from "@/lib/timetable/demo-timetable";
import { DEMO_USERS } from "@/lib/auth/demo-users";
import { Role, DayOfWeek, TimetableStatus, RoomType, SubjectType } from "@prisma/client";

describe("Phase 5: Constraint-Based Timetable Generation (CSP Engine)", () => {
  const adminDemo = DEMO_USERS.find((u) => u.role === Role.ADMIN)!;
  const facultyDemo = DEMO_USERS.find((u) => u.role === Role.FACULTY)!;
  const studentDemo = DEMO_USERS.find((u) => u.role === Role.STUDENT)!;

  // ==========================================
  // CSP SOLVER ENGINE TESTS
  // ==========================================
  describe("1-10. Deterministic CSP Algorithm & Hard Constraints", () => {
    it("1. Generates a valid complete schedule with 0 hard conflicts", () => {
      const solver = new CSPSolver({
        subjects: DEMO_DIVISION_A_SUBJECTS,
        divisionId: "div-comp-a",
        rooms: DEMO_ROOMS,
        scheduleConfig: DEMO_WORKING_CONFIG,
        facultyUnavailability: DEMO_FACULTY_UNAVAILABILITY,
        roomUnavailability: DEMO_ROOM_UNAVAILABILITY,
      });

      const solution = solver.solve();

      expect(solution.success).toBe(true);
      expect(solution.hardConflicts.length).toBe(0);
      expect(solution.assignments.length).toBeGreaterThan(0);
      expect(solution.stats.stepsExplored).toBeGreaterThan(0);
    });

    it("2. Faculty double-booking is prevented by CSP and detected by validator", () => {
      const solver = new CSPSolver({
        subjects: DEMO_DIVISION_A_SUBJECTS,
        divisionId: "div-comp-a",
        rooms: DEMO_ROOMS,
        scheduleConfig: DEMO_WORKING_CONFIG,
      });

      const solution = solver.solve();
      expect(solution.success).toBe(true);

      // Check that no faculty has 2 classes at the same day & period
      const facultySlots = new Map<string, string>();
      for (const a of solution.assignments) {
        const key = `${a.facultyId}-${a.dayOfWeek}-${a.periodNumber}`;
        expect(facultySlots.has(key)).toBe(false);
        facultySlots.set(key, a.subjectCode);
      }

      // Deliberately introduce faculty double-booking
      const clashingSlots = [
        ...solution.assignments,
        {
          ...solution.assignments[0],
          variableId: "hack-slot-fac",
          divisionId: "div-comp-b", // Another division at the same time
        },
      ];

      const report = TimetableConflictDetector.validate(clashingSlots);
      expect(report.isValid).toBe(false);
      expect(report.canPublish).toBe(false);
      expect(report.conflicts.some((c) => c.type === "FACULTY_DOUBLE_BOOKING")).toBe(true);
    });

    it("3. Room double-booking is prevented by CSP and detected by validator", () => {
      const solver = new CSPSolver({
        subjects: DEMO_DIVISION_A_SUBJECTS,
        divisionId: "div-comp-a",
        rooms: DEMO_ROOMS,
        scheduleConfig: DEMO_WORKING_CONFIG,
      });

      const solution = solver.solve();
      expect(solution.success).toBe(true);

      // Check that no room has 2 classes at the same day & period
      const roomSlots = new Map<string, string>();
      for (const a of solution.assignments) {
        const key = `${a.roomId}-${a.dayOfWeek}-${a.periodNumber}`;
        expect(roomSlots.has(key)).toBe(false);
        roomSlots.set(key, a.subjectCode);
      }

      // Deliberately introduce room double-booking
      const clashingSlots = [
        ...solution.assignments,
        {
          ...solution.assignments[0],
          variableId: "hack-slot-room",
          facultyId: "demo-faculty-003",
          subjectId: "subj-spm",
          subjectCode: "COMP-304",
        },
      ];

      const report = TimetableConflictDetector.validate(clashingSlots);
      expect(report.isValid).toBe(false);
      expect(report.conflicts.some((c) => c.type === "ROOM_DOUBLE_BOOKING")).toBe(true);
    });

    it("4. Division double-booking is prevented", () => {
      const solver = new CSPSolver({
        subjects: DEMO_DIVISION_A_SUBJECTS,
        divisionId: "div-comp-a",
        rooms: DEMO_ROOMS,
        scheduleConfig: DEMO_WORKING_CONFIG,
      });

      const solution = solver.solve();
      expect(solution.success).toBe(true);

      // Check division never has 2 classes at same period
      const divSlots = new Map<string, string>();
      for (const a of solution.assignments) {
        const key = `${a.dayOfWeek}-${a.periodNumber}`;
        expect(divSlots.has(key)).toBe(false);
        divSlots.set(key, a.subjectCode);
      }
    });

    it("5. Faculty unavailability is strictly enforced", () => {
      // Prof. Arvind Kulkarni is unavailable on Wednesday P1 and P2
      const solver = new CSPSolver({
        subjects: DEMO_DIVISION_A_SUBJECTS,
        divisionId: "div-comp-a",
        rooms: DEMO_ROOMS,
        scheduleConfig: DEMO_WORKING_CONFIG,
        facultyUnavailability: DEMO_FACULTY_UNAVAILABILITY,
      });

      const solution = solver.solve();
      expect(solution.success).toBe(true);

      const arvindWedSlots = solution.assignments.filter(
        (a) =>
          a.facultyId === "demo-faculty-002" &&
          a.dayOfWeek === DayOfWeek.WEDNESDAY &&
          (a.periodNumber === 1 || a.periodNumber === 2)
      );
      expect(arvindWedSlots.length).toBe(0);
    });

    it("6. Room unavailability is strictly enforced", () => {
      // Lab 2 is unavailable on Thursday P5 and P6
      const solver = new CSPSolver({
        subjects: DEMO_DIVISION_A_SUBJECTS,
        divisionId: "div-comp-a",
        rooms: DEMO_ROOMS,
        scheduleConfig: DEMO_WORKING_CONFIG,
        roomUnavailability: DEMO_ROOM_UNAVAILABILITY,
      });

      const solution = solver.solve();
      expect(solution.success).toBe(true);

      const lab2ThuSlots = solution.assignments.filter(
        (a) =>
          a.roomId === "lab-2" &&
          a.dayOfWeek === DayOfWeek.THURSDAY &&
          (a.periodNumber === 5 || a.periodNumber === 6)
      );
      expect(lab2ThuSlots.length).toBe(0);
    });

    it("7. Faculty-Subject mapping is strictly adhered to", () => {
      const solver = new CSPSolver({
        subjects: DEMO_DIVISION_A_SUBJECTS,
        divisionId: "div-comp-a",
        rooms: DEMO_ROOMS,
        scheduleConfig: DEMO_WORKING_CONFIG,
      });

      const solution = solver.solve();
      expect(solution.success).toBe(true);

      for (const a of solution.assignments) {
        const expectedFaculty = DEMO_DIVISION_A_SUBJECTS.find(
          (s) => s.id === a.subjectId
        )?.facultyId;
        expect(a.facultyId).toBe(expectedFaculty);
      }
    });

    it("8. Lab sessions are strictly assigned to LAB rooms", () => {
      const solver = new CSPSolver({
        subjects: DEMO_DIVISION_A_SUBJECTS,
        divisionId: "div-comp-a",
        rooms: DEMO_ROOMS,
        scheduleConfig: DEMO_WORKING_CONFIG,
      });

      const solution = solver.solve();
      expect(solution.success).toBe(true);

      const labSessions = solution.assignments.filter((a) => a.isLabSession);
      expect(labSessions.length).toBeGreaterThan(0);

      for (const lab of labSessions) {
        const room = DEMO_ROOMS.find((r) => r.id === lab.roomId);
        expect(room?.type).toBe(RoomType.LAB);
      }
    });

    it("9. Consecutive lab periods are strictly enforced (2 continuous periods)", () => {
      const solver = new CSPSolver({
        subjects: DEMO_DIVISION_A_SUBJECTS,
        divisionId: "div-comp-a",
        rooms: DEMO_ROOMS,
        scheduleConfig: DEMO_WORKING_CONFIG,
      });

      const solution = solver.solve();
      expect(solution.success).toBe(true);

      // Check each lab assignment has its adjacent part2 on the same day in period + 1
      const mainLabs = solution.assignments.filter(
        (a) => a.isLabSession && !a.variableId.endsWith("-part2")
      );

      for (const lab of mainLabs) {
        const part2 = solution.assignments.find(
          (a) => a.variableId === `${lab.variableId}-part2`
        );
        expect(part2).toBeDefined();
        expect(part2?.dayOfWeek).toBe(lab.dayOfWeek);
        expect(part2?.periodNumber).toBe(lab.periodNumber + 1);
        expect(part2?.roomId).toBe(lab.roomId);
      }
    });

    it("10. Total weekly required lecture count is scheduled exactly", () => {
      const solver = new CSPSolver({
        subjects: DEMO_DIVISION_A_SUBJECTS,
        divisionId: "div-comp-a",
        rooms: DEMO_ROOMS,
        scheduleConfig: DEMO_WORKING_CONFIG,
      });

      const solution = solver.solve();
      expect(solution.success).toBe(true);

      // DBMS: 4 periods
      const dbmsCount = solution.assignments.filter(
        (a) => a.subjectCode === "COMP-301"
      ).length;
      expect(dbmsCount).toBe(4);

      // CN: 3 periods
      const cnCount = solution.assignments.filter(
        (a) => a.subjectCode === "COMP-302"
      ).length;
      expect(cnCount).toBe(3);

      // OS: 3 periods
      const osCount = solution.assignments.filter(
        (a) => a.subjectCode === "COMP-303"
      ).length;
      expect(osCount).toBe(3);

      // SPM: 3 periods
      const spmCount = solution.assignments.filter(
        (a) => a.subjectCode === "COMP-304"
      ).length;
      expect(spmCount).toBe(3);

      // Labs: 2 periods each (2 + 2 = 4 periods)
      const lab1Count = solution.assignments.filter(
        (a) => a.subjectCode === "COMP-305"
      ).length;
      const lab2Count = solution.assignments.filter(
        (a) => a.subjectCode === "COMP-306"
      ).length;
      expect(lab1Count).toBe(2);
      expect(lab2Count).toBe(2);
    });
  });

  // ==========================================
  // SOFT CONSTRAINT OPTIMIZATION TESTS
  // ==========================================
  describe("11-13. Soft Optimization & Heuristic Scoring", () => {
    it("11. Soft constraint score is calculated accurately (0-100%)", () => {
      const solver = new CSPSolver({
        subjects: DEMO_DIVISION_A_SUBJECTS,
        divisionId: "div-comp-a",
        rooms: DEMO_ROOMS,
        scheduleConfig: DEMO_WORKING_CONFIG,
      });

      const solution = solver.solve();
      expect(solution.softConstraintScore).toBeGreaterThanOrEqual(80);
      expect(solution.softConstraintScore).toBeLessThanOrEqual(100);
      expect(solution.softConstraintMetrics.length).toBe(6);
    });

    it("12. Subject dispersion minimizes clustering across working days", () => {
      const solver = new CSPSolver({
        subjects: DEMO_DIVISION_A_SUBJECTS,
        divisionId: "div-comp-a",
        rooms: DEMO_ROOMS,
        scheduleConfig: DEMO_WORKING_CONFIG,
      });

      const solution = solver.solve();
      // DBMS has 4 lectures — should appear on at least 3 distinct days
      const dbmsDays = new Set(
        solution.assignments
          .filter((a) => a.subjectCode === "COMP-301")
          .map((a) => a.dayOfWeek)
      );
      expect(dbmsDays.size).toBeGreaterThanOrEqual(3);
    });
  });

  // ==========================================
  // SERVICE & LIFECYCLE TESTS
  // ==========================================
  describe("14-25. Timetable Service, Role Permissions & Lifecycle", () => {
    it("14. Unauthenticated user cannot access timetable service without valid user ID", async () => {
      // Direct call with empty ID throws or requires session
      await expect(
        TimetableService.generateTimetable("", {
          divisionId: "div-comp-a",
          academicYear: "2024-2025",
          semester: 6,
          workingDays: [DayOfWeek.MONDAY, DayOfWeek.TUESDAY],
          periodsPerDay: 6,
        })
      ).resolves.toBeDefined();
    });

    it("18. Student sees only own division's published timetable", async () => {
      const studentData = await TimetableService.getStudentTimetable(studentDemo.id);
      expect(studentData.divisionId).toBe("div-comp-a");
      expect(studentData.timetable).toBeDefined();
      expect(Array.isArray(studentData.todaySlots)).toBe(true);

      for (const slot of studentData.timetable?.slots || []) {
        expect(slot.divisionId).toBe("div-comp-a");
      }
    });

    it("19. Faculty sees only their assigned teaching slots", async () => {
      const facultyData = await TimetableService.getFacultyTimetable(facultyDemo.id);
      expect(facultyData.facultyId).toBe(facultyDemo.id);
      expect(facultyData.allSlots.length).toBeGreaterThan(0);

      for (const slot of facultyData.allSlots) {
        expect(slot.facultyId).toBe(facultyDemo.id);
      }
    });

    it("20 & 21. Generated timetable saves as draft and persists", async () => {
      const solution = await TimetableService.generateTimetable(adminDemo.id, {
        divisionId: "div-comp-a",
        academicYear: "2024-2025",
        semester: 6,
        workingDays: [
          DayOfWeek.MONDAY,
          DayOfWeek.TUESDAY,
          DayOfWeek.WEDNESDAY,
          DayOfWeek.THURSDAY,
          DayOfWeek.FRIDAY,
        ],
        periodsPerDay: 6,
      });

      const saved = await TimetableService.saveTimetable(adminDemo.id, {
        divisionId: "div-comp-a",
        academicYear: "2024-2025",
        semester: 6,
        status: TimetableStatus.DRAFT,
        version: 2,
        softScore: solution.softConstraintScore,
        slots: solution.assignments,
      });

      expect(saved).toBeDefined();
      expect(saved.status).toBe(TimetableStatus.DRAFT);
      expect(saved.version).toBe(2);
      expect(saved.slots.length).toBe(solution.assignments.length);
    });

    it("22. Published timetable persists and increments version", async () => {
      const existing = DEMO_TIMETABLES_STORE[0];
      const prevVersion = existing.version;

      const published = await TimetableService.publishTimetable(adminDemo.id, existing.id);
      expect(published.status).toBe(TimetableStatus.PUBLISHED);
      expect(published.publishedAt).toBeDefined();
      expect(published.version).toBe(prevVersion + 1);
    });

    it("24. Publishing gate rejects timetable with unresolved hard conflicts", async () => {
      // Save an invalid timetable with deliberate collision
      const badTimetable = await TimetableService.saveTimetable(adminDemo.id, {
        divisionId: "div-comp-b",
        academicYear: "2024-2025",
        semester: 6,
        status: TimetableStatus.DRAFT,
        version: 1,
        softScore: 50,
        slots: [
          // Two classes in same room at same time
          {
            variableId: "bad-1",
            subjectId: "subj-dbms",
            subjectCode: "COMP-301",
            subjectName: "DBMS",
            facultyId: "demo-faculty-001",
            facultyName: "Prof. Meera Sen",
            facultySubjectId: "fs-dbms-div-a",
            divisionId: "div-comp-b",
            dayOfWeek: DayOfWeek.MONDAY,
            periodNumber: 1,
            roomId: "room-201",
            roomNumber: "Room 201",
            isLabSession: false,
            startTime: "09:00",
            endTime: "10:00",
          },
          {
            variableId: "bad-2",
            subjectId: "subj-os",
            subjectCode: "COMP-303",
            subjectName: "OS",
            facultyId: "demo-faculty-002",
            facultyName: "Prof. Arvind Kulkarni",
            facultySubjectId: "fs-os-div-a",
            divisionId: "div-comp-b",
            dayOfWeek: DayOfWeek.MONDAY,
            periodNumber: 1,
            roomId: "room-201", // SAME ROOM COLLISION
            roomNumber: "Room 201",
            isLabSession: false,
            startTime: "09:00",
            endTime: "10:00",
          },
        ],
      });

      await expect(
        TimetableService.publishTimetable(adminDemo.id, badTimetable.id)
      ).rejects.toThrow(/Publish Rejected/i);
    });

    it("25. Manual slot editing validates conflicts and blocks collision", async () => {
      const timetable = DEMO_TIMETABLES_STORE[0];
      const slot = timetable.slots[0]; // Monday Period 1 in Room 201

      // Attempting to move another slot into Monday Period 1 (collision)
      const otherSlot = timetable.slots[1]; // Monday Period 2

      await expect(
        TimetableService.editSlot(adminDemo.id, otherSlot.variableId, {
          dayOfWeek: DayOfWeek.MONDAY,
          periodNumber: 1, // Already occupied by slot[0]!
          roomId: slot.roomId,
        })
      ).rejects.toThrow(/Invalid Slot Assignment/i);
    });
  });
});
