import { NextRequest, NextResponse } from "next/server";
import { checkRole } from "@/lib/auth/rbac";
import { Role, RoomType } from "@prisma/client";
import { AcademicService } from "@/services/academic.service";
import { createRoomSchema } from "@/validators/academic.schema";

export async function GET(req: NextRequest) {
  const auth = await checkRole([Role.ADMIN]);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const typeParam = searchParams.get("type");
  const type = typeParam ? (typeParam as RoomType) : undefined;
  const isAvailableParam = searchParams.get("isAvailable");
  const isAvailable = isAvailableParam !== null ? isAvailableParam === "true" : undefined;
  const isActiveParam = searchParams.get("isActive");
  const isActive = isActiveParam !== null ? isActiveParam === "true" : undefined;
  const search = searchParams.get("search") || undefined;

  const rooms = await AcademicService.getRooms({ type, isAvailable, isActive, search });
  return NextResponse.json({ success: true, rooms });
}

export async function POST(req: NextRequest) {
  const auth = await checkRole([Role.ADMIN]);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const parsed = createRoomSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const room = await AcademicService.createRoom(parsed.data, auth.user.id);
    return NextResponse.json({ success: true, room }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create room";
    const status = message.includes("already exists") ? 409 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
