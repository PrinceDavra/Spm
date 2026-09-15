import { z } from "zod";

export const AnalyticsDateRangeEnum = z.enum([
  "TODAY",
  "LAST_7_DAYS",
  "LAST_30_DAYS",
  "THIS_SEMESTER",
  "THIS_ACADEMIC_YEAR",
  "CUSTOM",
]);

export type AnalyticsDateRange = z.infer<typeof AnalyticsDateRangeEnum>;

export const analyticsFilterSchema = z.object({
  departmentId: z.string().optional(),
  programId: z.string().optional(),
  batchId: z.string().optional(),
  semester: z.coerce.number().int().min(1).max(8).optional(),
  divisionId: z.string().optional(),
  subjectId: z.string().optional(),
  facultyId: z.string().optional(),
  dateRange: AnalyticsDateRangeEnum.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type AnalyticsFilterInput = z.infer<typeof analyticsFilterSchema>;

export const ReportTypeEnum = z.enum([
  "attendance",
  "assignments",
  "faculty-workload",
  "placement",
  "events",
  "clubs",
  "lost-found",
]);

export type ReportType = z.infer<typeof ReportTypeEnum>;

export const analyticsExportSchema = analyticsFilterSchema.extend({
  report: ReportTypeEnum,
  format: z.enum(["csv"]).optional().default("csv"),
});

export type AnalyticsExportInput = z.infer<typeof analyticsExportSchema>;
