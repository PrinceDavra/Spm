import { z } from "zod";
import { ClubCategory, ClubStatus, MembershipRole, MembershipStatus, ClubActivityType } from "@prisma/client";

export const createClubSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Club name must be at least 3 characters")
    .max(100, "Club name cannot exceed 100 characters"),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters")
    .max(100, "Slug cannot exceed 100 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with optional hyphens")
    .optional(),
  shortDescription: z
    .string()
    .trim()
    .max(250, "Short description cannot exceed 250 characters")
    .optional()
    .nullable(),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description cannot exceed 5000 characters"),
  category: z.nativeEnum(ClubCategory),
  departmentId: z.string().uuid().optional().nullable(),
  facultyAdvisorId: z.string().optional().nullable(),
  coordinatorId: z.string().optional().nullable(),
  contactEmail: z.string().email("Invalid contact email").optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  logoUrl: z.string().url("Invalid logo URL").optional().nullable(),
  bannerUrl: z.string().url("Invalid banner URL").optional().nullable(),
  establishedYear: z.number().int().min(1950).max(2030).optional(),
  isRecruiting: z.boolean().optional(),
  status: z.nativeEnum(ClubStatus).optional(),
});

export const updateClubSchema = createClubSchema.partial();

export const joinClubSchema = z.object({
  message: z.string().max(500, "Statement cannot exceed 500 characters").optional(),
});

export const updateMembershipSchema = z.object({
  role: z.nativeEnum(MembershipRole).optional(),
  status: z.nativeEnum(MembershipStatus).optional(),
});

export const createActivitySchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Activity title must be at least 3 characters")
    .max(120, "Activity title cannot exceed 120 characters"),
  description: z
    .string()
    .trim()
    .min(5, "Activity description must be at least 5 characters")
    .max(3000, "Activity description cannot exceed 3000 characters"),
  activityDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid activity date format"),
  activityType: z.nativeEnum(ClubActivityType),
  venue: z.string().trim().max(100).optional().nullable(),
});

export const updateActivitySchema = createActivitySchema.partial();

export type CreateClubInput = z.infer<typeof createClubSchema>;
export type UpdateClubInput = z.infer<typeof updateClubSchema>;
export type JoinClubInput = z.infer<typeof joinClubSchema>;
export type UpdateMembershipInput = z.infer<typeof updateMembershipSchema>;
export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
