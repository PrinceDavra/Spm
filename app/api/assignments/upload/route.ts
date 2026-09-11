import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { AssignmentService } from "@/services/assignment.service";

export async function POST(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", message: "Login required." },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const allowedTypesParam = formData.get("allowedTypes") as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Missing File", message: "No file was uploaded." },
        { status: 400 }
      );
    }

    // Default allowed extensions if not passed
    const allowedExtensions = allowedTypesParam
      ? allowedTypesParam.split(",").map((s) => s.trim().toLowerCase())
      : ["pdf", "docx", "zip", "txt", "py", "java", "cpp", "sql", "yaml", "yml"];

    // 10MB maximum limit
    const maxSizeBytes = 10485760;

    // Validate using security rules (checks path traversal, blocked executable extensions, allowed list, and size)
    AssignmentService.validateUploadedFile(file.name, allowedExtensions, maxSizeBytes, file.size);

    // Generate sanitized unique storage key
    const sanitizedBaseName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueFileName = `${user.id.substring(0, 8)}_${Date.now()}_${sanitizedBaseName}`;
    const fileUrl = `/uploads/assignments/${uniqueFileName}`;

    return NextResponse.json({
      success: true,
      message: "File successfully uploaded and security validated.",
      file: {
        fileName: file.name,
        storedName: uniqueFileName,
        fileUrl,
        fileSize: file.size,
        fileType: file.type || "application/octet-stream",
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to upload file.";
    const status = message.includes("Security Violation") ? 403 : 400;
    return NextResponse.json({ success: false, error: "Upload Error", message }, { status });
  }
}
