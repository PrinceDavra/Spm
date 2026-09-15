import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { Role } from "@prisma/client";
import { ExamService } from "@/services/exam.service";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role === Role.STUDENT) {
    return NextResponse.json({ error: "Forbidden: Students cannot access aggregate exam analytics" }, { status: 403 });
  }

  try {
    const analytics = await ExamService.getExamAnalytics();
    return NextResponse.json({ analytics });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to retrieve exam analytics" }, { status: 500 });
  }
}
