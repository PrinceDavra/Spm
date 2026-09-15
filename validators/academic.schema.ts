import { z } from "zod";
import { SubjectType, RoomType } from "@prisma/client";

// ==========================================
// 1. DEPARTMENT SCHEMAS
// ==========================================

export const createDepartmentSchema = z.object({
  name: z.string().min(2, "Department name must be at least 2 characters").max(100),
  code: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .max(20)
    .regex(/^[A-Z0-9_-]+$/, "Code must contain only uppercase letters, numbers, hyphens or underscores"),
  description: z.string().max(500).optional().nullable(),
  headOfDepartment: z.string().max(100).optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const updateDepartmentSchema = createDepartmentSchema.partial();

export type CreateDepartmentInput = z.input<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.input<typeof updateDepartmentSchema>;

// ==========================================
// 2. PROGRAM / COURSE SCHEMAS
// ==========================================

export const createProgramSchema = z.object({
  name: z.string().min(2, "Program name must be at least 2 characters").max(100),
  code: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .max(20)
    .regex(/^[A-Z0-9_-]+$/, "Code must contain only uppercase letters, numbers, hyphens or underscores"),
  degree: z.string().min(2, "Degree must be at least 2 characters").max(50), // e.g. "B.Tech", "M.Tech", "BCA"
  departmentId: z.string().min(1, "Department is required"),
  durationYears: z.number().int().min(1, "Duration must be at least 1 year").max(6).default(4),
  totalSemesters: z.number().int().min(1, "Total semesters must be at least 1").max(12).default(8),
  isActive: z.boolean().optional().default(true),
});

export const updateProgramSchema = createProgramSchema.partial();

export type CreateProgramInput = z.input<typeof createProgramSchema>;
export type UpdateProgramInput = z.input<typeof updateProgramSchema>;

// ==========================================
// 3. BATCH SCHEMAS
// ==========================================

export const createBatchSchema = z
  .object({
    name: z.string().min(2, "Batch name must be at least 2 characters").max(50),
    startYear: z.number().int().min(2000, "Start year must be 2000 or later").max(2100),
    endYear: z.number().int().min(2001, "End year must be 2001 or later").max(2110),
    programId: z.string().min(1, "Program is required"),
    currentSemester: z.number().int().min(1).max(12).default(1),
    isActive: z.boolean().optional().default(true),
  })
  .refine((data) => data.endYear > data.startYear, {
    message: "End year must be strictly greater than start year",
    path: ["endYear"],
  });

export const updateBatchSchema = z
  .object({
    name: z.string().min(2).max(50).optional(),
    startYear: z.number().int().min(2000).max(2100).optional(),
    endYear: z.number().int().min(2001).max(2110).optional(),
    programId: z.string().min(1).optional(),
    currentSemester: z.number().int().min(1).max(12).optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.startYear !== undefined && data.endYear !== undefined) {
        return data.endYear > data.startYear;
      }
      return true;
    },
    {
      message: "End year must be strictly greater than start year",
      path: ["endYear"],
    }
  );

export type CreateBatchInput = z.input<typeof createBatchSchema>;
export type UpdateBatchInput = z.input<typeof updateBatchSchema>;

// ==========================================
// 4. ACADEMIC SEMESTER SCHEMAS
// ==========================================

export const createSemesterSchema = z.object({
  semesterNumber: z.number().int().min(1, "Semester must be between 1 and 12").max(12),
  academicYear: z
    .string()
    .regex(/^\d{4}-\d{4}$/, "Academic year must be in format YYYY-YYYY (e.g. 2024-2025)"),
  term: z.enum(["ODD", "EVEN", "FALL", "SPRING"]).default("EVEN"),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const updateSemesterSchema = createSemesterSchema.partial();

export type CreateSemesterInput = z.input<typeof createSemesterSchema>;
export type UpdateSemesterInput = z.input<typeof updateSemesterSchema>;

// ==========================================
// 5. CLASS SCHEMAS
// ==========================================

export const createClassSchema = z.object({
  departmentId: z.string().min(1, "Department is required"),
  semester: z.number().int().min(1).max(12),
  name: z.string().min(2, "Class name must be at least 2 characters").max(100),
  academicYear: z
    .string()
    .regex(/^\d{4}-\d{4}$/, "Academic year must be in format YYYY-YYYY"),
  programId: z.string().optional().nullable(),
  batchId: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const updateClassSchema = createClassSchema.partial();

export type CreateClassInput = z.input<typeof createClassSchema>;
export type UpdateClassInput = z.input<typeof updateClassSchema>;

// ==========================================
// 6. DIVISION SCHEMAS
// ==========================================

export const createDivisionSchema = z.object({
  classId: z.string().min(1, "Class is required"),
  name: z.string().min(1, "Division name is required").max(50), // e.g. "Division A"
  code: z.string().max(20).optional().nullable(), // e.g. "CE-A"
  capacity: z.number().int().min(1, "Student capacity must be at least 1").max(200).default(60),
  isActive: z.boolean().optional().default(true),
});

export const updateDivisionSchema = createDivisionSchema.partial();

export type CreateDivisionInput = z.input<typeof createDivisionSchema>;
export type UpdateDivisionInput = z.input<typeof updateDivisionSchema>;

// ==========================================
// 7. SUBJECT SCHEMAS
// ==========================================

export const createSubjectSchema = z.object({
  name: z.string().min(2, "Subject name must be at least 2 characters").max(150),
  code: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .max(20)
    .regex(/^[A-Z0-9_-]+$/, "Code must contain only uppercase letters, numbers, hyphens or underscores"),
  departmentId: z.string().min(1, "Department is required"),
  semester: z.number().int().min(1).max(12),
  credits: z.number().int().min(1, "Credits must be at least 1").max(10).default(3),
  type: z.nativeEnum(SubjectType).default(SubjectType.THEORY),
  weeklyHours: z.number().int().min(1, "Weekly hours must be at least 1").max(10).default(3),
  description: z.string().max(1000).optional().nullable(),
  syllabusUrl: z.string().url().optional().nullable().or(z.literal("")),
  programId: z.string().optional().nullable(),
  laboratoryId: z.string().optional().nullable(),
  requiresLab: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

export const updateSubjectSchema = createSubjectSchema.partial();

export type CreateSubjectInput = z.input<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.input<typeof updateSubjectSchema>;

// ==========================================
// 8. FACULTY MAPPING SCHEMAS
// ==========================================

export const createFacultyMappingSchema = z.object({
  facultyId: z.string().min(1, "Faculty ID is required"),
  subjectId: z.string().min(1, "Subject ID is required"),
  divisionId: z.string().min(1, "Division ID is required"),
  academicYear: z.string().min(1, "Academic year is required"),
  weeklyHours: z.number().int().min(1).max(20).optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const updateFacultyMappingSchema = z.object({
  weeklyHours: z.number().int().min(1).max(20).optional().nullable(),
  isActive: z.boolean().optional(),
});

export type CreateFacultyMappingInput = z.input<typeof createFacultyMappingSchema>;
export type UpdateFacultyMappingInput = z.input<typeof updateFacultyMappingSchema>;

// ==========================================
// 9. ROOM SCHEMAS
// ==========================================

export const createRoomSchema = z.object({
  roomNumber: z.string().min(1, "Room number is required").max(50),
  building: z.string().min(1, "Building name is required").max(100),
  floor: z.number().int().min(-2, "Floor must be valid").max(20),
  capacity: z.number().int().min(1, "Room capacity must be at least 1").max(1000),
  type: z.nativeEnum(RoomType).default(RoomType.CLASSROOM),
  hasProjector: z.boolean().optional().default(true),
  isAvailable: z.boolean().optional().default(true),
  departmentId: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const updateRoomSchema = createRoomSchema.partial();

export type CreateRoomInput = z.input<typeof createRoomSchema>;
export type UpdateRoomInput = z.input<typeof updateRoomSchema>;

// ==========================================
// 10. LABORATORY SCHEMAS
// ==========================================

export const createLaboratorySchema = z.object({
  name: z.string().min(2, "Laboratory name must be at least 2 characters").max(100),
  code: z
    .string()
    .min(2, "Lab code must be at least 2 characters")
    .max(30)
    .regex(/^[A-Z0-9_-]+$/, "Code must contain only uppercase letters, numbers, hyphens or underscores"),
  departmentId: z.string().min(1, "Department is required"),
  roomId: z.string().optional().nullable(),
  capacity: z.number().int().min(1, "Capacity must be at least 1").max(200).default(30),
  equipment: z.array(z.string()).optional().default([]),
  labAssistant: z.string().max(100).optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const updateLaboratorySchema = createLaboratorySchema.partial();

export type CreateLaboratoryInput = z.input<typeof createLaboratorySchema>;
export type UpdateLaboratoryInput = z.input<typeof updateLaboratorySchema>;

// ==========================================
// 11. HEALTH CHECK QUERY SCHEMAS
// ==========================================

export const configurationHealthFilterSchema = z.object({
  departmentId: z.string().optional(),
  academicYear: z.string().optional(),
  includeTimetableChecks: z.coerce.boolean().optional().default(true),
});
