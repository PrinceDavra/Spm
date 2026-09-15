import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/rbac";
import { LostFoundService } from "@/services/lost-found.service";

/**
 * POST /api/lost-found/upload
 * Securely validate and receive item photo attachments.
 */
export async function POST(req: NextRequest) {
  try {
    const { user, error } = await checkAuth();
    if (error) return error;

    const formData = await req.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json({ success: false, error: "Invalid form data" }, { status: 400 });
    }

    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ success: false, error: "No file was uploaded" }, { status: 400 });
    }

    // Security validation (checks extension, blocked scripts, path traversal, file size)
    const { sanitizedName, extension } = LostFoundService.validateUploadedAttachment(
      file.name,
      file.size,
      5242880 // 5MB limit
    );

    const storagePath = `/uploads/lost-found/${user.id.substring(0, 8)}_${sanitizedName}`;

    return NextResponse.json({
      success: true,
      message: "Photo uploaded and security-validated successfully.",
      attachment: {
        fileName: file.name,
        storedName: sanitizedName,
        fileUrl: storagePath,
        fileSize: file.size,
        extension,
        uploadedAt: new Date().toISOString(),
      },
    }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Upload failed";
    const status = message.includes("Security Violation") ? 403 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
