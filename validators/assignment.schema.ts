import { z } from "zod";
import { AssignmentStatus } from "@prisma/client";

export const assignmentAttachmentSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  fileUrl: z.string().min(1, "File URL is required"),
  fileType: z.string().default("application/pdf"),
  fileSize: z.number().int().positive("File size must be positive"),
});

export const createAssignmentSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(150, "Title cannot exceed 150 characters"),
  subjectId: z.string().min(1, "Subject is required"),
  divisionId: z.string().min(1, "Division is required"),
  description: z
    .string()
    .min(5, "Description must be at least 5 characters")
    .max(3000, "Description is too long"),
  instructions: z.string().max(5000).optional(),
  maxMarks: z.coerce
    .number()
    .int("Total marks must be an integer")
    .min(1, "Marks must be at least 1")
    .max(1000, "Marks cannot exceed 1000")
    .optional(),
  dueDate: z.string().refine((val) => {
    const d = new Date(val);
    return !isNaN(d.getTime());
  }, "Invalid due date format"),
  status: z
    .nativeEnum(AssignmentStatus)
    .optional(),
  allowLateSubmission: z.boolean().optional(),
  latePenalty: z.coerce
    .number()
    .min(0, "Penalty cannot be negative")
    .max(100, "Penalty cannot exceed 100%")
    .optional(),
  maxFileSize: z.coerce
    .number()
    .int()
    .min(1024, "Max file size must be at least 1KB")
    .max(104857600, "Max file size cannot exceed 100MB")
    .optional(),
  allowedFileTypes: z
    .array(z.string())
    .min(1, "Select at least one allowed file type")
    .optional(),
  attachments: z.array(assignmentAttachmentSchema).optional(),
});

export const updateAssignmentSchema = createAssignmentSchema.partial();

export const submitAssignmentSchema = z
  .object({
    fileUrl: z.string().optional(),
    fileName: z.string().optional(),
    fileSize: z.number().int().optional(),
    fileType: z.string().optional(),
    submissionText: z.string().max(10000).optional(),
    comments: z.string().max(2000).optional(),
  })
  .refine(
    (data) => (data.fileUrl && data.fileUrl.trim().length > 0) || (data.submissionText && data.submissionText.trim().length > 0),
    {
      message: "Please attach a file or provide submission solution text.",
      path: ["submissionText"],
    }
  );

export const gradeSubmissionSchema = z.object({
  marks: z.coerce
    .number()
    .min(0, "Marks cannot be negative"),
  feedback: z
    .string()
    .min(3, "Feedback must be at least 3 characters")
    .max(2500, "Feedback cannot exceed 2500 characters"),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
export type SubmitAssignmentInput = z.infer<typeof submitAssignmentSchema>;
export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>;
