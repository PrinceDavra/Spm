import { DayOfWeek, RoomType } from "@prisma/client";
import {
  CSPSlotAssignment,
  FacultyUnavailability,
  RoomInfo,
  RoomUnavailability,
} from "./csp-solver";

export type ConflictType =
  | "FACULTY_DOUBLE_BOOKING"
  | "ROOM_DOUBLE_BOOKING"
  | "DIVISION_DOUBLE_BOOKING"
  | "FACULTY_UNAVAILABLE"
  | "ROOM_UNAVAILABLE"
  | "LAB_ROOM_MISMATCH"
  | "CONSECUTIVE_LAB_VIOLATION";

export interface TimetableConflict {
  id: string;
  type: ConflictType;
  severity: "CRITICAL" | "WARNING";
  title: string;
  description: string;
  dayOfWeek: DayOfWeek;
  periodNumber: number;
  entityName?: string;
  slotId?: string;
  conflictingSlotId?: string;
}

export interface ValidationReport {
  isValid: boolean;
  canPublish: boolean;
  totalConflicts: number;
  conflicts: TimetableConflict[];
  summary: string;
}

export class TimetableConflictDetector {
  /**
   * Validates a set of timetable slots against all academic hard constraints.
   */
  public static validate(
    slots: CSPSlotAssignment[],
    options?: {
      rooms?: RoomInfo[];
      facultyUnavailability?: FacultyUnavailability[];
      roomUnavailability?: RoomUnavailability[];
      globalSlots?: CSPSlotAssignment[]; // Slots from other divisions to detect cross-class clashes
    }
  ): ValidationReport {
    const conflicts: TimetableConflict[] = [];
    let conflictIndex = 1;

    const allSlots = [...slots, ...(options?.globalSlots || [])];

    // 1. Check Faculty Double-Booking
    for (let i = 0; i < allSlots.length; i++) {
      for (let j = i + 1; j < allSlots.length; j++) {
        const s1 = allSlots[i];
        const s2 = allSlots[j];

        if (
          s1.dayOfWeek === s2.dayOfWeek &&
          s1.periodNumber === s2.periodNumber
        ) {
          // Faculty double-booking
          if (s1.facultyId === s2.facultyId) {
            conflicts.push({
              id: `conf-fac-${conflictIndex++}`,
              type: "FACULTY_DOUBLE_BOOKING",
              severity: "CRITICAL",
              title: "Faculty Double-Booking Conflict",
              description: `Faculty ${s1.facultyName} is scheduled concurrently for ${s1.subjectCode} (${s1.divisionId}) and ${s2.subjectCode} (${s2.divisionId}) on ${s1.dayOfWeek} Period ${s1.periodNumber}.`,
              dayOfWeek: s1.dayOfWeek,
              periodNumber: s1.periodNumber,
              entityName: s1.facultyName,
              slotId: s1.variableId,
              conflictingSlotId: s2.variableId,
            });
          }

          // Room double-booking
          if (s1.roomId === s2.roomId) {
            conflicts.push({
              id: `conf-room-${conflictIndex++}`,
              type: "ROOM_DOUBLE_BOOKING",
              severity: "CRITICAL",
              title: "Room Over-Allocation Conflict",
              description: `Room ${s1.roomNumber} is allocated to both ${s1.subjectCode} (${s1.divisionId}) and ${s2.subjectCode} (${s2.divisionId}) at the same time on ${s1.dayOfWeek} Period ${s1.periodNumber}.`,
              dayOfWeek: s1.dayOfWeek,
              periodNumber: s1.periodNumber,
              entityName: s1.roomNumber,
              slotId: s1.variableId,
              conflictingSlotId: s2.variableId,
            });
          }

          // Division double-booking (for the same division)
          if (s1.divisionId === s2.divisionId && s1.variableId !== s2.variableId) {
            conflicts.push({
              id: `conf-div-${conflictIndex++}`,
              type: "DIVISION_DOUBLE_BOOKING",
              severity: "CRITICAL",
              title: "Division Overlap Conflict",
              description: `Division ${s1.divisionId} has two distinct sessions (${s1.subjectCode} and ${s2.subjectCode}) scheduled concurrently on ${s1.dayOfWeek} Period ${s1.periodNumber}.`,
              dayOfWeek: s1.dayOfWeek,
              periodNumber: s1.periodNumber,
              entityName: s1.divisionId,
              slotId: s1.variableId,
              conflictingSlotId: s2.variableId,
            });
          }
        }
      }
    }

    // 2. Check Faculty Unavailability
    if (options?.facultyUnavailability) {
      for (const slot of slots) {
        const unavail = options.facultyUnavailability.find(
          (u) =>
            u.facultyId === slot.facultyId &&
            u.dayOfWeek === slot.dayOfWeek &&
            u.periodNumber === slot.periodNumber
        );
        if (unavail) {
          conflicts.push({
            id: `conf-fac-unavail-${conflictIndex++}`,
            type: "FACULTY_UNAVAILABLE",
            severity: "CRITICAL",
            title: "Faculty Unavailability Violation",
            description: `${slot.facultyName} is marked unavailable on ${slot.dayOfWeek} Period ${slot.periodNumber}${
              unavail.reason ? ` (${unavail.reason})` : ""
            }.`,
            dayOfWeek: slot.dayOfWeek,
            periodNumber: slot.periodNumber,
            entityName: slot.facultyName,
            slotId: slot.variableId,
          });
        }
      }
    }

    // 3. Check Room Unavailability
    if (options?.roomUnavailability) {
      for (const slot of slots) {
        const unavail = options.roomUnavailability.find(
          (u) =>
            u.roomId === slot.roomId &&
            u.dayOfWeek === slot.dayOfWeek &&
            u.periodNumber === slot.periodNumber
        );
        if (unavail) {
          conflicts.push({
            id: `conf-room-unavail-${conflictIndex++}`,
            type: "ROOM_UNAVAILABLE",
            severity: "CRITICAL",
            title: "Room Unavailability Violation",
            description: `Room ${slot.roomNumber} is unavailable on ${slot.dayOfWeek} Period ${slot.periodNumber}${
              unavail.reason ? ` (${unavail.reason})` : ""
            }.`,
            dayOfWeek: slot.dayOfWeek,
            periodNumber: slot.periodNumber,
            entityName: slot.roomNumber,
            slotId: slot.variableId,
          });
        }
      }
    }

    // 4. Check Lab Room Type Suitability
    if (options?.rooms) {
      for (const slot of slots) {
        const room = options.rooms.find((r) => r.id === slot.roomId);
        if (room && slot.isLabSession && room.type !== RoomType.LAB) {
          conflicts.push({
            id: `conf-lab-room-${conflictIndex++}`,
            type: "LAB_ROOM_MISMATCH",
            severity: "CRITICAL",
            title: "Lab Room Type Incompatibility",
            description: `Practical lab session ${slot.subjectCode} is scheduled in ${room.roomNumber}, which is a ${room.type} rather than a LAB.`,
            dayOfWeek: slot.dayOfWeek,
            periodNumber: slot.periodNumber,
            entityName: room.roomNumber,
            slotId: slot.variableId,
          });
        }
      }
    }

    // 5. Check Consecutive Lab Period Integrity
    const labVariables = new Set(
      slots.filter((s) => s.isLabSession).map((s) => s.variableId.replace("-part2", ""))
    );

    for (const varId of labVariables) {
      const parts = slots.filter(
        (s) => s.variableId === varId || s.variableId === `${varId}-part2`
      );
      if (parts.length === 2) {
        const [p1, p2] = parts.sort((a, b) => a.periodNumber - b.periodNumber);
        if (p1.dayOfWeek !== p2.dayOfWeek || p2.periodNumber !== p1.periodNumber + 1) {
          conflicts.push({
            id: `conf-consec-${conflictIndex++}`,
            type: "CONSECUTIVE_LAB_VIOLATION",
            severity: "CRITICAL",
            title: "Broken Consecutive Lab Periods",
            description: `Lab session ${p1.subjectCode} must occupy 2 continuous periods on the same day, but is broken across Period ${p1.periodNumber} and Period ${p2.periodNumber}.`,
            dayOfWeek: p1.dayOfWeek,
            periodNumber: p1.periodNumber,
            entityName: p1.subjectCode,
            slotId: p1.variableId,
          });
        }
      }
    }

    const criticalCount = conflicts.filter((c) => c.severity === "CRITICAL").length;
    const isValid = criticalCount === 0;

    return {
      isValid,
      canPublish: isValid,
      totalConflicts: conflicts.length,
      conflicts,
      summary: isValid
        ? "All timetable slots satisfy academic hard constraints with 0 conflicts."
        : `Detected ${conflicts.length} conflict(s). Timetable cannot be published until all critical conflicts are resolved.`,
    };
  }
}
