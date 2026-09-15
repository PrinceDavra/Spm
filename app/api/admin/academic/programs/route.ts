import { NextRequest, NextResponse } from "next/server";
import { checkRole } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { AcademicService } from "@/services/academic.service";
import { createProgramSchema } from "@/validators/academic.schema";

export async function GET(req: NextRequest) {
  const auth = await checkRole([Role.ADMIN]);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get("departmentId") || undefined;
  const search = searchParams.get("search") || undefined;
  const isActiveParam = searchParams.get("isActive");
  const isActive = isActiveParam !== null ? isActiveParam === "true" : undefined;

  const programs = await AcademicService.getPrograms({ departmentId, search, isActive });
  return NextResponse.json({ success: true, programs });
}

export async function POST(req: NextRequest) {
  const auth = await checkRole([Role.ADMIN]);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const parsed = createProgramSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const program = await AcademicService.createProgram(parsed.data, auth.user.id);
    return NextResponse.json({ success: true, program }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create program";
    const status = message.includes("already exists") ? 409 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
