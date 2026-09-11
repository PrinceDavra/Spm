import { prisma } from "@/lib/prisma";
import { isDatabaseOnline } from "@/lib/db-health";
import { DayOfWeek, TimetableStatus } from "@prisma/client";
import {
  CSPSolver,
  CSPSolution,
  CSPSlotAssignment,
  AcademicSubject,
  RoomInfo,
} from "@/lib/timetable/csp-solver";
import {
  TimetableConflictDetector,
  ValidationReport,
} from "@/lib/timetable/conflict-detector";
import {
  DEMO_ROOMS,
  DEMO_WORKING_CONFIG,
  DEMO_FACULTY_UNAVAILABILITY,
  DEMO_ROOM_UNAVAILABILITY,
  DEMO_DIVISION_A_SUBJECTS,
  DEMO_TIMETABLES_STORE,
  DemoTimetableRecord,
} from "@/lib/timetable/demo-timetable";
import {
  GenerateTimetableInput,
  SaveTimetableInput,
  EditSlotInput,
} from "@/validators/timetable.schema";

export class TimetableService {
  /**
   * Retrieves academic inputs and active constraints for the timetable generator.
   */
  static async getAcademicConfiguration(divisionId = "div-comp-a") {
    return {
      divisionId,
      divisionName: divisionId === "div-comp-a" ? "Division A" : "Division B",
      className: "TE Computer Engineering",
      semester: 6,
      academicYear: "2024-2025",
      subjects: DEMO_DIVISION_A_SUBJECTS,
      rooms: DEMO_ROOMS,
      workingConfig: DEMO_WORKING_CONFIG,
      facultyUnavailability: DEMO_FACULTY_UNAVAILABILITY,
      roomUnavailability: DEMO_ROOM_UNAVAILABILITY,
    };
  }

  /**
   * Generates a conflict-free timetable using the deterministic CSP Solver.
   */
  static async generateTimetable(
    adminUserId: string,
    input: GenerateTimetableInput
  ): Promise<CSPSolution> {
    const subjects = DEMO_DIVISION_A_SUBJECTS;
    const rooms = DEMO_ROOMS;

    const solver = new CSPSolver({
      subjects,
      divisionId: input.divisionId,
      rooms,
      scheduleConfig: {
        ...DEMO_WORKING_CONFIG,
        workingDays: input.workingDays,
        periodsPerDay: input.periodsPerDay,
      },
      facultyUnavailability: DEMO_FACULTY_UNAVAILABILITY,
      roomUnavailability: DEMO_ROOM_UNAVAILABILITY,
    });

    const solution = solver.solve();

    // Audit log generation event
    try {
      if (await isDatabaseOnline()) {
        await prisma.auditLog.create({
          data: {
            userId: adminUserId,
            action: "TIMETABLE_GENERATED",
            entity: "Timetable",
            entityId: input.divisionId,
            details: {
              success: solution.success,
              sessionsCount: solution.assignments.length,
              softScore: solution.softConstraintScore,
              executionTimeMs: solution.stats.executionTimeMs,
            },
          },
        });
      }
    } catch {
      // Non-blocking
    }

    return solution;
  }

  /**
   * Validates a candidate set of timetable slots against hard constraints.
   */
  static validateTimetableSlots(
    slots: CSPSlotAssignment[],
    options?: { divisionId?: string }
  ): ValidationReport {
    return TimetableConflictDetector.validate(slots, {
      rooms: DEMO_ROOMS,
      facultyUnavailability: DEMO_FACULTY_UNAVAILABILITY,
      roomUnavailability: DEMO_ROOM_UNAVAILABILITY,
    });
  }

  /**
   * Saves a generated or edited timetable as DRAFT or active record.
   */
  static async saveTimetable(
    adminUserId: string,
    input: SaveTimetableInput
  ): Promise<DemoTimetableRecord> {
    const existingIndex = DEMO_TIMETABLES_STORE.findIndex(
      (t) =>
        t.divisionId === input.divisionId &&
        t.academicYear === input.academicYear &&
        t.semester === input.semester
    );

    const now = new Date().toISOString();
    const timetableId =
      existingIndex >= 0
        ? DEMO_TIMETABLES_STORE[existingIndex].id
        : `tt-${input.divisionId}-${Date.now()}`;

    const newRecord: DemoTimetableRecord = {
      id: timetableId,
      divisionId: input.divisionId,
      divisionName: input.divisionId === "div-comp-a" ? "Division A" : "Division B",
      className: "TE Computer Engineering",
      semester: input.semester,
      academicYear: input.academicYear,
      status: input.status,
      version: input.version,
      softScore: input.softScore,
      createdAt:
        existingIndex >= 0
          ? DEMO_TIMETABLES_STORE[existingIndex].createdAt
          : now,
      updatedAt: now,
      slots: input.slots,
    };

    if (existingIndex >= 0) {
      DEMO_TIMETABLES_STORE[existingIndex] = newRecord;
    } else {
      DEMO_TIMETABLES_STORE.push(newRecord);
    }

    // Audit log
    try {
      if (await isDatabaseOnline()) {
        await prisma.auditLog.create({
          data: {
            userId: adminUserId,
            action: "TIMETABLE_SAVED",
            entity: "Timetable",
            entityId: timetableId,
            details: {
              status: input.status,
              version: input.version,
              slotsCount: input.slots.length,
            },
          },
        });
      }
    } catch {
      // Non-blocking
    }

    return newRecord;
  }

  /**
   * Publishes a timetable after verifying 0 hard conflicts.
   */
  static async publishTimetable(
    adminUserId: string,
    timetableId: string
  ): Promise<DemoTimetableRecord> {
    const timetable = DEMO_TIMETABLES_STORE.find((t) => t.id === timetableId);

    if (!timetable) {
      throw new Error(`Timetable ${timetableId} not found.`);
    }

    // Gate: Validate conflicts before publishing
    const validation = this.validateTimetableSlots(timetable.slots);
    if (!validation.canPublish) {
      throw new Error(
        `Publish Rejected: Cannot publish timetable with ${validation.totalConflicts} unresolved conflict(s). Review conflict diagnostics.`
      );
    }

    const now = new Date().toISOString();
    timetable.status = TimetableStatus.PUBLISHED;
    timetable.publishedAt = now;
    timetable.version += 1;
    timetable.updatedAt = now;

    // Audit log
    try {
      if (await isDatabaseOnline()) {
        await prisma.auditLog.create({
          data: {
            userId: adminUserId,
            action: "TIMETABLE_PUBLISHED",
            entity: "Timetable",
            entityId: timetableId,
            details: {
              version: timetable.version,
              publishedAt: now,
              slotsCount: timetable.slots.length,
              softScore: timetable.softScore,
            },
          },
        });
      }
    } catch {
      // Non-blocking
    }

    return timetable;
  }

  /**
   * Manually edits an individual timetable slot with real-time conflict checking.
   */
  static async editSlot(
    adminUserId: string,
    slotVariableId: string,
    input: EditSlotInput
  ): Promise<{ success: boolean; slot: CSPSlotAssignment; timetable: DemoTimetableRecord }> {
    // Find slot in store
    let targetTimetable: DemoTimetableRecord | null = null;
    let targetSlot: CSPSlotAssignment | null = null;

    for (const tt of DEMO_TIMETABLES_STORE) {
      const found = tt.slots.find((s) => s.variableId === slotVariableId);
      if (found) {
        targetTimetable = tt;
        targetSlot = found;
        break;
      }
    }

    if (!targetTimetable || !targetSlot) {
      throw new Error(`Timetable slot '${slotVariableId}' not found.`);
    }

    const newRoom = DEMO_ROOMS.find((r) => r.id === input.roomId);
    if (!newRoom) {
      throw new Error(`Room ID '${input.roomId}' is invalid.`);
    }

    // Clone slots and test proposed modification
    const proposedSlots = targetTimetable.slots.map((s) =>
      s.variableId === slotVariableId
        ? {
            ...s,
            dayOfWeek: input.dayOfWeek,
            periodNumber: input.periodNumber,
            roomId: input.roomId,
            roomNumber: newRoom.roomNumber,
          }
        : s
    );

    const validation = this.validateTimetableSlots(proposedSlots);
    if (!validation.isValid) {
      const firstError = validation.conflicts[0]?.description || "Conflict detected.";
      throw new Error(`Invalid Slot Assignment: ${firstError}`);
    }

    // Apply valid update
    targetSlot.dayOfWeek = input.dayOfWeek;
    targetSlot.periodNumber = input.periodNumber;
    targetSlot.roomId = input.roomId;
    targetSlot.roomNumber = newRoom.roomNumber;
    targetTimetable.updatedAt = new Date().toISOString();

    // Audit log
    try {
      if (await isDatabaseOnline()) {
        await prisma.auditLog.create({
          data: {
            userId: adminUserId,
            action: "TIMETABLE_SLOT_EDITED",
            entity: "TimetableSlot",
            entityId: slotVariableId,
            details: {
              dayOfWeek: input.dayOfWeek,
              periodNumber: input.periodNumber,
              roomId: input.roomId,
              reason: input.reason || "Manual admin adjustment",
            },
          },
        });
      }
    } catch {
      // Non-blocking
    }

    return {
      success: true,
      slot: targetSlot,
      timetable: targetTimetable,
    };
  }

  /**
   * Retrieves published timetable and today's schedule for a student.
   */
  static async getStudentTimetable(studentUserId: string) {
    // Demo student is enrolled in Division A
    const divisionId = "div-comp-a";
    const published = DEMO_TIMETABLES_STORE.find(
      (t) => t.divisionId === divisionId && t.status === TimetableStatus.PUBLISHED
    ) || DEMO_TIMETABLES_STORE[0];

    const todayDay = this.getCurrentDayOfWeek();
    const todaySlots = published
      ? published.slots
          .filter((s) => s.dayOfWeek === todayDay)
          .sort((a, b) => a.periodNumber - b.periodNumber)
      : [];

    return {
      divisionId,
      divisionName: "Division A",
      className: "TE Computer Engineering",
      semester: 6,
      academicYear: "2024-2025",
      timetable: published,
      todayDay,
      todaySlots,
    };
  }

  /**
   * Retrieves published teaching schedule across all divisions for a faculty member.
   */
  static async getFacultyTimetable(facultyUserId: string) {
    // Gather all teaching slots across published timetables
    const facultySlots: CSPSlotAssignment[] = [];

    for (const tt of DEMO_TIMETABLES_STORE) {
      if (tt.status === TimetableStatus.PUBLISHED) {
        const matching = tt.slots.filter((s) => s.facultyId === facultyUserId);
        facultySlots.push(...matching);
      }
    }

    const todayDay = this.getCurrentDayOfWeek();
    const todaySlots = facultySlots
      .filter((s) => s.dayOfWeek === todayDay)
      .sort((a, b) => a.periodNumber - b.periodNumber);

    return {
      facultyId: facultyUserId,
      totalWeeklyTeachingPeriods: facultySlots.length,
      todayDay,
      todaySlots,
      allSlots: facultySlots,
    };
  }

  /**
   * Returns current DayOfWeek for today's schedule highlight.
   */
  private static getCurrentDayOfWeek(): DayOfWeek {
    const days: DayOfWeek[] = [
      DayOfWeek.MONDAY, // Default Sunday to Monday for academic preview
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
    ];
    return days[new Date().getDay()] || DayOfWeek.MONDAY;
  }
}
