import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { Role } from "@prisma/client";
import { ExamService } from "@/services/exam.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden: Only administrators can lock exam results" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const locked = await ExamService.lockResults(id, session.id);
    return NextResponse.json({ exam: locked, message: "Exam results locked successfully" });
  } catch (error: any) {
    const status = error.message?.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: error.message || "Failed to lock results" }, { status });
  }
}
