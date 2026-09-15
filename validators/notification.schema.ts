import { z } from "zod";
import { NotificationType, NotificationPriority, PreferenceChannel, NoticeAudience } from "@prisma/client";

export const notificationFilterSchema = z.object({
  type: z.nativeEnum(NotificationType).optional(),
  priority: z.nativeEnum(NotificationPriority).optional(),
  isRead: z
    .string()
    .optional()
    .transform((val) => {
      if (val === undefined || val === null || val === "") return undefined;
      return val === "true";
    }),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const markNotificationReadSchema = z.object({
  isRead: z.boolean().default(true),
});

export const bulkMarkReadSchema = z.object({
  ids: z.array(z.string()).optional(),
});

export const preferenceItemSchema = z.object({
  category: z.nativeEnum(NotificationType),
  channel: z.nativeEnum(PreferenceChannel),
});

export const updateNotificationPreferencesSchema = z.object({
  preferences: z.array(preferenceItemSchema).min(1, "At least one preference must be provided"),
});

export const createAnnouncementSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  content: z.string().min(5, "Content must be at least 5 characters").max(5000),
  priority: z.nativeEnum(NotificationPriority).default(NotificationPriority.NORMAL),
  audience: z.nativeEnum(NoticeAudience).default(NoticeAudience.ALL),
  departmentId: z.string().optional().nullable(),
  programId: z.string().optional().nullable(),
  batchId: z.string().optional().nullable(),
  semester: z.coerce.number().int().min(1).max(12).optional().nullable(),
  divisionId: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  link: z.string().url().optional().nullable().or(z.literal("")),
});

export type NotificationFilterInput = z.infer<typeof notificationFilterSchema>;
export type MarkNotificationReadInput = z.infer<typeof markNotificationReadSchema>;
export type BulkMarkReadInput = z.infer<typeof bulkMarkReadSchema>;
export type PreferenceItemInput = z.infer<typeof preferenceItemSchema>;
export type UpdateNotificationPreferencesInput = z.infer<typeof updateNotificationPreferencesSchema>;
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
