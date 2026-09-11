import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { TimetableService } from "@/services/timetable.service";
import { editSlotSchema } from "@/validators/timetable.schema";
import { Role } from "@prisma/client";
import { ZodError } from "zod";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", message: "Login required." },
        { status: 401 }
      );
    }

    if (user.role !== Role.ADMIN) {
      return NextResponse.json(
        { success: false, error: "Forbidden", message: "Only administrators can edit timetable slots." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const validatedData = editSlotSchema.parse(body);

    const result = await TimetableService.editSlot(user.id, id, validatedData);

    return NextResponse.json({
      success: true,
      message: "Slot updated successfully after verifying 0 hard conflicts.",
      result,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation Error", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Failed to edit slot.";
    const status = message.includes("Invalid Slot Assignment") ? 409 : 500;

    return NextResponse.json({ success: false, error: "Edit Error", message }, { status });
  }
}
