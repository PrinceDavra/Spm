import { z } from "zod";
import {
  LostFoundType,
  LostFoundCategory,
  LostFoundStatus,
  ClaimStatus,
} from "@prisma/client";

// ==========================================
// REPORT SCHEMAS
// ==========================================

export const createReportSchema = z.object({
  type: z.nativeEnum(LostFoundType),
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title cannot exceed 100 characters"),
  category: z.nativeEnum(LostFoundCategory),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description cannot exceed 2000 characters"),
  location: z
    .string()
    .trim()
    .min(2, "Location must be at least 2 characters")
    .max(100, "Location cannot exceed 100 characters"),
  dateLostFound: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid date format"),
  timeLostFound: z.string().trim().max(50).optional().nullable(),
  contactPreference: z.string().trim().max(50).default("CAMPUS_PORTAL"),
  identifyingDetails: z.string().trim().max(1000).optional().nullable(),
  imageUrl: z.string().trim().max(500).optional().nullable(),
  status: z.nativeEnum(LostFoundStatus).optional().default(LostFoundStatus.PUBLISHED),
});

export const updateReportSchema = z.object({
  title: z.string().trim().min(3).max(100).optional(),
  category: z.nativeEnum(LostFoundCategory).optional(),
  description: z.string().trim().min(10).max(2000).optional(),
  location: z.string().trim().min(2).max(100).optional(),
  dateLostFound: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date").optional(),
  timeLostFound: z.string().trim().max(50).optional().nullable(),
  contactPreference: z.string().trim().max(50).optional(),
  identifyingDetails: z.string().trim().max(1000).optional().nullable(),
  imageUrl: z.string().trim().max(500).optional().nullable(),
  status: z.nativeEnum(LostFoundStatus).optional(),
});

// ==========================================
// CLAIM SCHEMAS
// ==========================================

export const submitClaimSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  claimStatement: z
    .string()
    .trim()
    .min(10, "Claim statement must be at least 10 characters")
    .max(2000, "Claim statement cannot exceed 2000 characters"),
  verificationAnswers: z
    .string()
    .trim()
    .min(10, "Verification details must be at least 10 characters to prove ownership")
    .max(2000, "Verification details cannot exceed 2000 characters"),
});

export const reviewClaimSchema = z.object({
  status: z.enum([
    ClaimStatus.UNDER_REVIEW,
    ClaimStatus.VERIFIED,
    ClaimStatus.APPROVED,
    ClaimStatus.REJECTED,
  ]),
  reviewerRemarks: z.string().trim().max(1000).optional().nullable(),
});

export const handoverSchema = z.object({
  claimId: z.string().min(1, "Claim ID is required"),
  handoverNotes: z.string().trim().max(1000).optional().nullable(),
});

export const resolveItemSchema = z.object({
  resolutionNotes: z.string().trim().max(1000).optional().nullable(),
  resolvedToUserId: z.string().optional().nullable(),
});

// Type inference exports using z.input so callers can omit defaulted fields
export type CreateReportInput = z.input<typeof createReportSchema>;
export type UpdateReportInput = z.input<typeof updateReportSchema>;
export type SubmitClaimInput = z.input<typeof submitClaimSchema>;
export type ReviewClaimInput = z.input<typeof reviewClaimSchema>;
export type HandoverInput = z.input<typeof handoverSchema>;
export type ResolveItemInput = z.input<typeof resolveItemSchema>;
