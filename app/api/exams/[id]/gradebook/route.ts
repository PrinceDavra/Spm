import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { Role } from "@prisma/client";
import { ExamService } from "@/services/exam.service";
import { bulkGradebookSchema, gradebookEntrySchema } from "@/validators/exam.schema";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role === Role.STUDENT) {
    return NextResponse.json({ error: "Forbidden: Students cannot access the full exam gradebook" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const gradebook = await ExamService.getExamGradebook(id, session.id, session.role);
    return NextResponse.json({ gradebook, entries: gradebook.entries });
  } catch (error: any) {
    const status = error.message?.includes("not found") ? 404 : error.message?.includes("authorized") ? 403 : 500;
    return NextResponse.json({ error: error.message || "Failed to retrieve gradebook" }, { status });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role === Role.STUDENT) {
    return NextResponse.json({ error: "Forbidden: Students cannot submit grades" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const body = await request.json();

    // Support both single entry or bulk entries array
    let entriesToSave: any[] = [];
    if (body.entries && Array.isArray(body.entries)) {
      const parsed = bulkGradebookSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
      }
      entriesToSave = parsed.data.entries;
    } else {
      const parsed = gradebookEntrySchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
      }
      entriesToSave = [parsed.data];
    }

    const result = await ExamService.saveGradebookEntries(id, entriesToSave, session.id, session.role);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    const isForbidden = error.message?.includes("authorized");
    const isLocked = error.message?.includes("locked") || error.message?.includes("archived") || error.message?.includes("state");
    const status = isForbidden ? 403 : isLocked ? 400 : error.message?.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: error.message || "Failed to save gradebook entries" }, { status });
  }
}
