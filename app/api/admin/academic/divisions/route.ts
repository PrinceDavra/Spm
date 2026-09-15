import { NextRequest, NextResponse } from "next/server";
import { checkRole } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { AcademicService } from "@/services/academic.service";
import { createDivisionSchema } from "@/validators/academic.schema";

export async function GET(req: NextRequest) {
  const auth = await checkRole([Role.ADMIN]);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId") || undefined;
  const isActiveParam = searchParams.get("isActive");
  const isActive = isActiveParam !== null ? isActiveParam === "true" : undefined;

  const divisions = await AcademicService.getDivisions({ classId, isActive });
  return NextResponse.json({ success: true, divisions });
}

export async function POST(req: NextRequest) {
  const auth = await checkRole([Role.ADMIN]);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const parsed = createDivisionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const division = await AcademicService.createDivision(parsed.data, auth.user.id);
    return NextResponse.json({ success: true, division }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create division";
    const status = message.includes("already exists") ? 409 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
