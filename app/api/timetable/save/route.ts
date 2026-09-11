import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { TimetableService } from "@/services/timetable.service";
import { saveTimetableSchema } from "@/validators/timetable.schema";
import { Role } from "@prisma/client";
import { ZodError } from "zod";

export async function POST(req: NextRequest) {
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
        { success: false, error: "Forbidden", message: "Only administrators can save timetables." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = saveTimetableSchema.parse(body);

    const timetable = await TimetableService.saveTimetable(user.id, validatedData);

    return NextResponse.json({
      success: true,
      message: `Timetable saved successfully as ${timetable.status}.`,
      timetable,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation Error", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Failed to save timetable.";
    return NextResponse.json({ success: false, error: "Save Error", message }, { status: 500 });
  }
}
