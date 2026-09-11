import { z } from "zod";

// List of immutable fields for students
export const STUDENT_IMMUTABLE_FIELDS = [
  "rollNumber",
  "prnNumber",
  "department",
  "departmentId",
  "departmentName",
  "semester",
  "division",
  "divisionId",
  "email",
  "cgpa",
  "batchYear",
  "id",
  "userId",
  "role",
] as const;

// List of immutable fields for faculty
export const FACULTY_IMMUTABLE_FIELDS = [
  "employeeId",
  "department",
  "departmentId",
  "departmentName",
  "designation",
  "email",
  "id",
  "userId",
  "role",
] as const;

/**
 * Permitted update schema for students
 */
export const updateStudentProfileSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number cannot exceed 15 digits")
    .optional()
    .or(z.literal("")),
  bio: z
    .string()
    .trim()
    .max(500, "Bio cannot exceed 500 characters")
    .optional()
    .or(z.literal("")),
  skills: z
    .array(z.string().trim().min(1).max(35, "Skill name too long"))
    .max(25, "Maximum 25 skills permitted")
    .optional(),
  avatarUrl: z
    .string()
    .trim()
    .url("Invalid avatar URL format")
    .optional()
    .or(z.literal("")),
});

export type UpdateStudentProfileInput = z.infer<typeof updateStudentProfileSchema>;

/**
 * Permitted update schema for faculty
 */
export const updateFacultyProfileSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number cannot exceed 15 digits")
    .optional()
    .or(z.literal("")),
  officeRoom: z
    .string()
    .trim()
    .max(50, "Office room cannot exceed 50 characters")
    .optional()
    .or(z.literal("")),
  qualification: z
    .string()
    .trim()
    .max(100, "Qualification cannot exceed 100 characters")
    .optional()
    .or(z.literal("")),
  specialization: z
    .string()
    .trim()
    .max(100, "Specialization cannot exceed 100 characters")
    .optional()
    .or(z.literal("")),
  avatarUrl: z
    .string()
    .trim()
    .url("Invalid avatar URL format")
    .optional()
    .or(z.literal("")),
});

export type UpdateFacultyProfileInput = z.infer<typeof updateFacultyProfileSchema>;
