import { z } from "zod";
import { EventCategory, EventStatus, EventAttendanceStatus } from "@prisma/client";

export const createEventSchema = z
  .object({
    title: z.string().trim().min(3, "Title must be at least 3 characters").max(150, "Title cannot exceed 150 characters"),
    slug: z.string().trim().optional(),
    summary: z.string().trim().min(5, "Summary must be at least 5 characters").max(300, "Summary cannot exceed 300 characters").optional(),
    description: z.string().trim().min(10, "Description must be at least 10 characters"),
    category: z.nativeEnum(EventCategory, {
      message: "Invalid event category selected",
    }),
    venue: z.string().trim().min(2, "Venue must be at least 2 characters").max(100, "Venue cannot exceed 100 characters"),
    startDateTime: z.string().or(z.date()).transform((val) => new Date(val)),
    endDateTime: z.string().or(z.date()).transform((val) => new Date(val)),
    registrationOpenAt: z.string().or(z.date()).optional().transform((val) => (val ? new Date(val) : new Date())),
    registrationDeadline: z.string().or(z.date()).transform((val) => new Date(val)),
    capacity: z.coerce.number().int().min(1, "Capacity must be at least 1 seat").max(10000, "Capacity cannot exceed 10,000"),
    posterUrl: z.string().url("Invalid poster URL").or(z.string().trim().min(1)).optional().nullable(),
    status: z.nativeEnum(EventStatus).optional().default(EventStatus.PUBLISHED),
  })
  .refine((data) => data.endDateTime > data.startDateTime, {
    message: "Event end time must be chronologically after the start time",
    path: ["endDateTime"],
  })
  .refine((data) => data.registrationDeadline <= data.endDateTime, {
    message: "Registration deadline cannot be after the event conclusion",
    path: ["registrationDeadline"],
  });

export type CreateEventInput = z.input<typeof createEventSchema>;
export type CreateEventOutput = z.infer<typeof createEventSchema>;

export const updateEventSchema = z
  .object({
    title: z.string().trim().min(3).max(150).optional(),
    slug: z.string().trim().optional(),
    summary: z.string().trim().min(5).max(300).optional(),
    description: z.string().trim().min(10).optional(),
    category: z.nativeEnum(EventCategory).optional(),
    venue: z.string().trim().min(2).max(100).optional(),
    startDateTime: z.string().or(z.date()).optional().transform((val) => (val ? new Date(val) : undefined)),
    endDateTime: z.string().or(z.date()).optional().transform((val) => (val ? new Date(val) : undefined)),
    registrationDeadline: z.string().or(z.date()).optional().transform((val) => (val ? new Date(val) : undefined)),
    capacity: z.coerce.number().int().min(1).max(10000).optional(),
    posterUrl: z.string().optional().nullable(),
    status: z.nativeEnum(EventStatus).optional(),
  });

export type UpdateEventInput = z.input<typeof updateEventSchema>;

export const markAttendanceSchema = z.object({
  registrationId: z.string().min(1, "Registration ID is required").optional(),
  userId: z.string().min(1, "User ID is required").optional(),
  attendanceStatus: z.nativeEnum(EventAttendanceStatus, {
    message: "Attendance status must be PRESENT or ABSENT",
  }),
});

export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
