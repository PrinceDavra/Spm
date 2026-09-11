import { z } from "zod";
import { DayOfWeek, TimetableStatus } from "@prisma/client";

export const generateTimetableSchema = z.object({
  divisionId: z.string().min(1, "Division ID is required"),
  academicYear: z.string().default("2024-2025"),
  semester: z.number().int().min(1).max(8).default(6),
  workingDays: z
    .array(z.nativeEnum(DayOfWeek))
    .min(1, "At least one working day required")
    .default([
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
    ]),
  periodsPerDay: z.number().int().min(4).max(8).default(6),
});

export const timetableSlotItemSchema = z.object({
  variableId: z.string(),
  subjectId: z.string(),
  subjectCode: z.string(),
  subjectName: z.string(),
  facultyId: z.string(),
  facultyName: z.string(),
  facultySubjectId: z.string(),
  divisionId: z.string(),
  dayOfWeek: z.nativeEnum(DayOfWeek),
  periodNumber: z.number().int().min(1).max(8),
  roomId: z.string(),
  roomNumber: z.string(),
  isLabSession: z.boolean(),
  startTime: z.string(),
  endTime: z.string(),
});

export const saveTimetableSchema = z.object({
  divisionId: z.string().min(1, "Division ID is required"),
  academicYear: z.string().default("2024-2025"),
  semester: z.number().int().min(1).max(8).default(6),
  status: z.nativeEnum(TimetableStatus).default(TimetableStatus.DRAFT),
  version: z.number().int().min(1).default(1),
  softScore: z.number().min(0).max(100).default(0),
  slots: z.array(timetableSlotItemSchema),
});

export const publishTimetableSchema = z.object({
  timetableId: z.string().min(1, "Timetable ID is required"),
});

export const editSlotSchema = z.object({
  dayOfWeek: z.nativeEnum(DayOfWeek),
  periodNumber: z.number().int().min(1).max(8),
  roomId: z.string().min(1, "Room ID is required"),
  reason: z.string().optional(),
});

export type GenerateTimetableInput = z.infer<typeof generateTimetableSchema>;
export type SaveTimetableInput = z.infer<typeof saveTimetableSchema>;
export type EditSlotInput = z.infer<typeof editSlotSchema>;
