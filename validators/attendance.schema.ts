import { z } from "zod";

export const attendanceStatusEnum = z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]);

export const markAttendanceRecordItemSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  status: attendanceStatusEnum,
  remarks: z.string().max(250, "Remarks cannot exceed 250 characters").optional(),
});

export const markAttendanceSchema = z.object({
  facultySubjectId: z.string().min(1, "Faculty subject mapping ID is required"),
  divisionId: z.string().min(1, "Division ID is required"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must follow YYYY-MM-DD format"),
  periodNumber: z
    .number()
    .int("Period number must be an integer")
    .min(1, "Period must be between 1 and 8")
    .max(8, "Period must be between 1 and 8"),
  topicCovered: z.string().max(250, "Topic cannot exceed 250 characters").optional(),
  records: z
    .array(markAttendanceRecordItemSchema)
    .min(1, "Attendance requires at least one student record"),
});

export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;

export const editAttendanceRecordSchema = z.object({
  status: attendanceStatusEnum,
  remarks: z.string().max(250, "Remarks cannot exceed 250 characters").optional(),
  reasonForEdit: z
    .string()
    .min(5, "Reason for editing attendance must be at least 5 characters for audit logging"),
});

export type EditAttendanceRecordInput = z.infer<typeof editAttendanceRecordSchema>;
