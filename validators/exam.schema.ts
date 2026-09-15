import { z } from "zod";
import { ExamType, ExamStatus, RevaluationStatus } from "@prisma/client";

export const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
export const academicYearRegex = /^\d{4}-\d{4}$/;

export const baseExamSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(150),
  examType: z.nativeEnum(ExamType).default(ExamType.INTERNAL),
  academicYear: z.string().regex(academicYearRegex, "Academic year format must be YYYY-YYYY (e.g. 2024-2025)"),
  semesterNumber: z.coerce.number().int().min(1).max(8),
  departmentId: z.string().min(1, "Department is required"),
  programId: z.string().optional().nullable(),
  batchId: z.string().optional().nullable(),
  divisionId: z.string().optional().nullable(),
  subjectId: z.string().min(1, "Subject is required"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().regex(timeRegex, "Start time must be HH:MM in 24-hour format"),
  endTime: z.string().regex(timeRegex, "End time must be HH:MM in 24-hour format"),
  roomId: z.string().optional().nullable(),
  facultyId: z.string().optional().nullable(),
  maxMarks: z.coerce.number().min(1, "Maximum marks must be at least 1").max(1000).default(100),
  passingMarks: z.coerce.number().min(1, "Passing marks must be at least 1").max(1000).default(40),
  instructions: z.string().max(2000).optional().nullable(),
});

export const createExamSchema = baseExamSchema.refine((data) => {
  if (data.passingMarks > data.maxMarks) {
    return false;
  }
  return true;
}, {
  message: "Passing marks cannot exceed maximum marks",
  path: ["passingMarks"],
}).refine((data) => {
  const [startH, startM] = data.startTime.split(":").map(Number);
  const [endH, endM] = data.endTime.split(":").map(Number);
  return endH * 60 + endM > startH * 60 + startM;
}, {
  message: "End time must be strictly after start time",
  path: ["endTime"],
});

export type CreateExamInput = z.infer<typeof createExamSchema>;

export const updateExamSchema = baseExamSchema.partial().extend({
  status: z.nativeEnum(ExamStatus).optional(),
}).refine((data) => {
  if (data.passingMarks !== undefined && data.maxMarks !== undefined && data.passingMarks > data.maxMarks) {
    return false;
  }
  return true;
}, {
  message: "Passing marks cannot exceed maximum marks",
  path: ["passingMarks"],
}).refine((data) => {
  if (data.startTime && data.endTime) {
    const [startH, startM] = data.startTime.split(":").map(Number);
    const [endH, endM] = data.endTime.split(":").map(Number);
    return endH * 60 + endM > startH * 60 + startM;
  }
  return true;
}, {
  message: "End time must be strictly after start time",
  path: ["endTime"],
});
export type UpdateExamInput = z.infer<typeof updateExamSchema>;

export const scheduleExamSchema = z.object({
  date: z.string().min(1, "Date is required"),
  startTime: z.string().regex(timeRegex, "Start time must be HH:MM in 24-hour format"),
  endTime: z.string().regex(timeRegex, "End time must be HH:MM in 24-hour format"),
  roomId: z.string().min(1, "Room is required"),
  facultyId: z.string().min(1, "Faculty invigilator is required"),
  divisionId: z.string().optional().nullable(),
}).refine((data) => {
  const [startH, startM] = data.startTime.split(":").map(Number);
  const [endH, endM] = data.endTime.split(":").map(Number);
  return endH * 60 + endM > startH * 60 + startM;
}, {
  message: "End time must be strictly after start time",
  path: ["endTime"],
});

export type ScheduleExamInput = z.infer<typeof scheduleExamSchema>;

export const gradebookEntrySchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  marksObtained: z.coerce.number().min(0, "Marks cannot be negative").max(1000).nullable().optional(),
  isAbsent: z.boolean().default(false),
  remarks: z.string().max(500).optional().nullable(),
});

export type GradebookEntryInput = z.infer<typeof gradebookEntrySchema>;

export const bulkGradebookSchema = z.object({
  entries: z.array(gradebookEntrySchema).min(1, "At least one gradebook entry is required"),
});

export type BulkGradebookInput = z.infer<typeof bulkGradebookSchema>;

export const revaluationRequestSchema = z.object({
  examId: z.string().min(1, "Exam ID is required"),
  subjectId: z.string().min(1, "Subject ID is required"),
  reason: z.string().min(10, "Reason must be at least 10 characters").max(1000),
  requestedMarks: z.coerce.number().min(0).max(1000).optional().nullable(),
});

export type RevaluationRequestInput = z.infer<typeof revaluationRequestSchema>;

export const reviewRevaluationSchema = z.object({
  status: z.nativeEnum(RevaluationStatus),
  reviewedMarks: z.coerce.number().min(0, "Marks cannot be negative").max(1000).optional().nullable(),
  revisedMarks: z.coerce.number().min(0, "Marks cannot be negative").max(1000).optional().nullable(),
  reviewerRemarks: z.string().min(3, "Reviewer remarks must be at least 3 characters").max(1000).optional().nullable(),
  reviewRemarks: z.string().min(3, "Reviewer remarks must be at least 3 characters").max(1000).optional().nullable(),
}).transform((data) => ({
  status: data.status,
  reviewedMarks: data.reviewedMarks ?? data.revisedMarks,
  reviewerRemarks: data.reviewerRemarks ?? data.reviewRemarks ?? "Review completed.",
}));

export type ReviewRevaluationInput = z.infer<typeof reviewRevaluationSchema>;

export const examFilterSchema = z.object({
  departmentId: z.string().optional(),
  semesterNumber: z.coerce.number().int().min(1).max(8).optional(),
  divisionId: z.string().optional(),
  subjectId: z.string().optional(),
  facultyId: z.string().optional(),
  status: z.nativeEnum(ExamStatus).optional(),
  examType: z.nativeEnum(ExamType).optional(),
  academicYear: z.string().optional(),
  date: z.string().optional(),
});

export type ExamFilterInput = z.infer<typeof examFilterSchema>;
