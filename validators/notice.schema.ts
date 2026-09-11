import { z } from "zod";
import { NoticeCategory, NoticePriority, NoticeAudience, NoticeStatus } from "@prisma/client";

const FORBIDDEN_EXTENSIONS = [
  ".exe",
  ".bat",
  ".cmd",
  ".sh",
  ".msi",
  ".vbs",
  ".ps1",
  ".scr",
  ".com",
  ".pif",
  ".jar",
];

const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".docx",
  ".doc",
  ".xlsx",
  ".xls",
  ".pptx",
  ".ppt",
  ".txt",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".zip",
  ".tar.gz",
];

export function isSafeAttachment(fileName: string): boolean {
  if (!fileName || typeof fileName !== "string") return false;
  // Block directory traversal
  if (fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
    return false;
  }
  const lower = fileName.toLowerCase();
  for (const ext of FORBIDDEN_EXTENSIONS) {
    if (lower.endsWith(ext)) return false;
  }
  return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export const noticeAttachmentSchema = z.object({
  fileName: z
    .string()
    .min(1, "Attachment file name is required")
    .refine(isSafeAttachment, "File type not permitted or invalid file name"),
  fileUrl: z.string().min(1, "Attachment file URL is required"),
  fileType: z.string().default("application/pdf"),
  fileSize: z
    .number()
    .int()
    .positive("File size must be greater than zero")
    .max(26214400, "Attachment cannot exceed 25MB"),
});

export const createNoticeSchema = z
  .object({
    title: z
      .string()
      .min(3, "Notice title must be at least 3 characters")
      .max(150, "Notice title cannot exceed 150 characters"),
    summary: z
      .string()
      .max(300, "Summary cannot exceed 300 characters")
      .optional()
      .nullable(),
    content: z
      .string()
      .min(5, "Notice content must be at least 5 characters")
      .max(15000, "Notice content cannot exceed 15,000 characters"),
    category: z.nativeEnum(NoticeCategory, {
      message: "Invalid notice category",
    }),
    priority: z
      .nativeEnum(NoticePriority, {
        message: "Invalid notice priority",
      })
      .default(NoticePriority.NORMAL),
    audience: z
      .nativeEnum(NoticeAudience, {
        message: "Invalid target audience",
      })
      .default(NoticeAudience.ALL),
    status: z
      .nativeEnum(NoticeStatus, {
        message: "Invalid notice status",
      })
      .default(NoticeStatus.PUBLISHED)
      .optional(),
    departmentId: z.string().optional().nullable(),
    classId: z.string().optional().nullable(),
    divisionId: z.string().optional().nullable(),
    semester: z.coerce
      .number()
      .int()
      .min(1, "Semester must be between 1 and 8")
      .max(8, "Semester must be between 1 and 8")
      .optional()
      .nullable(),
    publishDate: z.string().optional().nullable(),
    expiryDate: z.string().optional().nullable(),
    attachmentUrl: z.string().optional().nullable(),
    attachments: z.array(noticeAttachmentSchema).optional().default([]),
  })
  .refine(
    (data) => {
      if (data.publishDate && data.expiryDate) {
        const pub = new Date(data.publishDate).getTime();
        const exp = new Date(data.expiryDate).getTime();
        if (!isNaN(pub) && !isNaN(exp) && exp < pub) {
          return false;
        }
      }
      return true;
    },
    {
      message: "Expiry date cannot be earlier than publish date",
      path: ["expiryDate"],
    }
  );

export const updateNoticeSchema = z
  .object({
    title: z.string().min(3).max(150).optional(),
    summary: z.string().max(300).optional().nullable(),
    content: z.string().min(5).max(15000).optional(),
    category: z.nativeEnum(NoticeCategory).optional(),
    priority: z.nativeEnum(NoticePriority).optional(),
    audience: z.nativeEnum(NoticeAudience).optional(),
    status: z.nativeEnum(NoticeStatus).optional(),
    departmentId: z.string().optional().nullable(),
    classId: z.string().optional().nullable(),
    divisionId: z.string().optional().nullable(),
    semester: z.coerce.number().int().min(1).max(8).optional().nullable(),
    publishDate: z.string().optional().nullable(),
    expiryDate: z.string().optional().nullable(),
    attachmentUrl: z.string().optional().nullable(),
    attachments: z.array(noticeAttachmentSchema).optional(),
  })
  .refine(
    (data) => {
      if (data.publishDate && data.expiryDate) {
        const pub = new Date(data.publishDate).getTime();
        const exp = new Date(data.expiryDate).getTime();
        if (!isNaN(pub) && !isNaN(exp) && exp < pub) {
          return false;
        }
      }
      return true;
    },
    {
      message: "Expiry date cannot be earlier than publish date",
      path: ["expiryDate"],
    }
  );

export type CreateNoticeInput = z.input<typeof createNoticeSchema>;
export type UpdateNoticeInput = z.input<typeof updateNoticeSchema>;
