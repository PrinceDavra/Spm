import { z } from "zod";
import {
  PlacementDriveStatus,
  EmploymentType,
  ApplicationStatus,
  QuestionDifficulty,
  QuizStatus,
  PrepCategory,
} from "@prisma/client";

// ==========================================
// COMPANY SCHEMAS
// ==========================================

export const createCompanySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name cannot exceed 100 characters"),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters")
    .max(100, "Slug cannot exceed 100 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens")
    .optional(),
  website: z.string().url("Invalid website URL").optional().nullable(),
  industry: z
    .string()
    .trim()
    .min(2, "Industry must be at least 2 characters")
    .max(100, "Industry cannot exceed 100 characters"),
  logoUrl: z.string().url("Invalid logo URL").optional().nullable(),
  description: z.string().trim().max(2000, "Description cannot exceed 2000 characters").optional().nullable(),
  location: z.string().trim().max(100).optional().nullable(),
  companySize: z.string().trim().max(50).optional().nullable(),
  contactPerson: z.string().trim().max(100).optional().nullable(),
  contactEmail: z.string().email("Invalid contact email").optional().nullable(),
  contactPhone: z.string().trim().max(25).optional().nullable(),
});

export const updateCompanySchema = createCompanySchema.partial();

// ==========================================
// PLACEMENT DRIVE SCHEMAS
// ==========================================

export const createDriveSchema = z.object({
  companyId: z.string().min(1, "Company is required"),
  title: z
    .string()
    .trim()
    .min(3, "Drive title must be at least 3 characters")
    .max(150, "Drive title cannot exceed 150 characters"),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters")
    .max(150, "Slug cannot exceed 150 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens")
    .optional(),
  role: z
    .string()
    .trim()
    .min(2, "Designation/Role must be at least 2 characters")
    .max(100, "Designation/Role cannot exceed 100 characters"),
  employmentType: z.nativeEnum(EmploymentType),
  location: z.string().trim().min(2, "Location must be at least 2 characters").max(100),
  packageMin: z.number().min(0, "Minimum package must be at least 0 LPA"),
  packageMax: z.number().min(0, "Maximum package must be at least 0 LPA"),
  currency: z.string().trim().default("INR"),
  description: z
    .string()
    .trim()
    .min(10, "Job description must be at least 10 characters")
    .max(5000, "Job description cannot exceed 5000 characters"),
  applicationDeadline: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid deadline format"),
  driveDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid drive date format")
    .optional()
    .nullable(),
  status: z.nativeEnum(PlacementDriveStatus).optional(),
  minCgpa: z.number().min(0).max(10).default(6.0),
  maxBacklogs: z.number().int().min(0).default(0),
  allowedDepartments: z.array(z.string()).default([]),
  allowedSemesters: z.array(z.number().int().min(1).max(8)).default([]),
  requiredSkills: z.array(z.string()).default([]),
  batchCriteria: z.string().trim().max(100).optional().nullable(),
  bondDetails: z.string().trim().max(500).optional().nullable(),
  selectionRounds: z.array(z.string()).default([]),
}).refine((data) => data.packageMax >= data.packageMin, {
  message: "Maximum package must be greater than or equal to minimum package",
  path: ["packageMax"],
});

export const updateDriveSchema = z.object({
  title: z.string().trim().min(3).max(150).optional(),
  role: z.string().trim().min(2).max(100).optional(),
  employmentType: z.nativeEnum(EmploymentType).optional(),
  location: z.string().trim().min(2).max(100).optional(),
  packageMin: z.number().min(0).optional(),
  packageMax: z.number().min(0).optional(),
  currency: z.string().trim().optional(),
  description: z.string().trim().min(10).max(5000).optional(),
  applicationDeadline: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid deadline").optional(),
  driveDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date").optional().nullable(),
  status: z.nativeEnum(PlacementDriveStatus).optional(),
  minCgpa: z.number().min(0).max(10).optional(),
  maxBacklogs: z.number().int().min(0).optional(),
  allowedDepartments: z.array(z.string()).optional(),
  allowedSemesters: z.array(z.number().int().min(1).max(8)).optional(),
  requiredSkills: z.array(z.string()).optional(),
  batchCriteria: z.string().trim().max(100).optional().nullable(),
  bondDetails: z.string().trim().max(500).optional().nullable(),
  selectionRounds: z.array(z.string()).optional(),
});

// ==========================================
// APPLICATION SCHEMAS
// ==========================================

export const applyDriveSchema = z.object({
  resumeUrl: z.string().url("Invalid resume URL").optional().nullable(),
  notes: z.string().trim().max(500, "Notes cannot exceed 500 characters").optional().nullable(),
  coverNote: z.string().trim().max(500, "Cover note cannot exceed 500 characters").optional().nullable(),
});

export const updateApplicationStatusSchema = z.object({
  status: z.nativeEnum(ApplicationStatus),
  remarks: z.string().trim().max(500, "Remarks cannot exceed 500 characters").optional().nullable(),
});

// ==========================================
// PREPARATION QUESTION SCHEMAS
// ==========================================

export const createQuestionSchema = z.object({
  category: z.nativeEnum(PrepCategory),
  question: z
    .string()
    .trim()
    .min(5, "Question must be at least 5 characters")
    .max(2000, "Question cannot exceed 2000 characters"),
  options: z
    .array(z.string().trim().min(1, "Option text cannot be empty"))
    .min(2, "Question must have at least 2 options")
    .max(6, "Question cannot exceed 6 options"),
  correctOptionIndex: z.number().int().min(0, "Invalid correct option index"),
  explanation: z.string().trim().max(2000, "Explanation cannot exceed 2000 characters").optional().nullable(),
  difficulty: z.nativeEnum(QuestionDifficulty).default(QuestionDifficulty.MEDIUM),
  topic: z.string().trim().min(2, "Topic must be at least 2 characters").max(100),
  marks: z.number().int().min(1, "Marks must be at least 1").max(10).default(1),
  isActive: z.boolean().default(true),
}).refine((data) => data.correctOptionIndex < data.options.length, {
  message: "Correct option index out of options range",
  path: ["correctOptionIndex"],
});

export const updateQuestionSchema = z.object({
  category: z.nativeEnum(PrepCategory).optional(),
  question: z.string().trim().min(5).max(2000).optional(),
  options: z.array(z.string().trim().min(1)).min(2).max(6).optional(),
  correctOptionIndex: z.number().int().min(0).optional(),
  explanation: z.string().trim().max(2000).optional().nullable(),
  difficulty: z.nativeEnum(QuestionDifficulty).optional(),
  topic: z.string().trim().min(2).max(100).optional(),
  marks: z.number().int().min(1).max(10).optional(),
  isActive: z.boolean().optional(),
});

// ==========================================
// QUIZ SCHEMAS
// ==========================================

export const createQuizSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Quiz title must be at least 3 characters")
    .max(120, "Quiz title cannot exceed 120 characters"),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters")
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens")
    .optional(),
  category: z.nativeEnum(PrepCategory),
  durationSeconds: z.number().int().min(60, "Duration must be at least 60 seconds (1 min)").max(7200, "Duration cannot exceed 2 hours").default(1800),
  questionCount: z.number().int().min(1, "Quiz must have at least 1 question").max(100).default(10),
  totalMarks: z.number().int().min(1).default(20),
  passingMarks: z.number().int().min(1).default(10),
  status: z.nativeEnum(QuizStatus).optional(),
  questionIds: z.array(z.string()).optional(),
}).refine((data) => data.passingMarks <= data.totalMarks, {
  message: "Passing marks cannot exceed total marks",
  path: ["passingMarks"],
});

export const updateQuizSchema = z.object({
  title: z.string().trim().min(3).max(120).optional(),
  category: z.nativeEnum(PrepCategory).optional(),
  durationSeconds: z.number().int().min(60).max(7200).optional(),
  questionCount: z.number().int().min(1).max(100).optional(),
  totalMarks: z.number().int().min(1).optional(),
  passingMarks: z.number().int().min(1).optional(),
  status: z.nativeEnum(QuizStatus).optional(),
  questionIds: z.array(z.string()).optional(),
});

export const recordAnswerSchema = z.object({
  questionId: z.string().min(1, "Question ID is required"),
  selectedOptionIndex: z.number().int().min(0).max(10).optional().nullable(),
});

// Type inference exports
export type CreateCompanyInput = z.input<typeof createCompanySchema>;
export type UpdateCompanyInput = z.input<typeof updateCompanySchema>;
export type CreateDriveInput = z.input<typeof createDriveSchema>;
export type UpdateDriveInput = z.input<typeof updateDriveSchema>;
export type ApplyDriveInput = z.input<typeof applyDriveSchema>;
export type UpdateApplicationStatusInput = z.input<typeof updateApplicationStatusSchema>;
export type CreateQuestionInput = z.input<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.input<typeof updateQuestionSchema>;
export type CreateQuizInput = z.input<typeof createQuizSchema>;
export type UpdateQuizInput = z.input<typeof updateQuizSchema>;
export type RecordAnswerInput = z.input<typeof recordAnswerSchema>;
