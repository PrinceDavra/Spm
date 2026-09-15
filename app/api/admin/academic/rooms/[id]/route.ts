import { NextRequest, NextResponse } from "next/server";
import { checkRole } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { AcademicService } from "@/services/academic.service";
import { updateRoomSchema } from "@/validators/academic.schema";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await checkRole([Role.ADMIN]);
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const room = await AcademicService.getRoomById(id);
  if (!room) {
    return NextResponse.json({ success: false, error: "Room not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, room });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await checkRole([Role.ADMIN]);
  if (auth.error) return auth.error;

  const { id } = await context.params;
  try {
    const body = await req.json();
    const parsed = updateRoomSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const room = await AcademicService.updateRoom(id, parsed.data, auth.user.id);
    return NextResponse.json({ success: true, room });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update room";
    const status = message.includes("not found") ? 404 : message.includes("already exists") ? 409 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await checkRole([Role.ADMIN]);
  if (auth.error) return auth.error;

  const { id } = await context.params;
  try {
    const room = await AcademicService.deleteRoom(id, auth.user.id);
    return NextResponse.json({ success: true, room, message: "Room deactivated successfully" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete room";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
