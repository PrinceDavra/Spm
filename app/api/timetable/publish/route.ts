import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { TimetableService } from "@/services/timetable.service";
import { publishTimetableSchema } from "@/validators/timetable.schema";
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
        { success: false, error: "Forbidden", message: "Only administrators can publish timetables." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = publishTimetableSchema.parse(body);

    const published = await TimetableService.publishTimetable(
      user.id,
      validatedData.timetableId
    );

    return NextResponse.json({
      success: true,
      message: `Timetable published successfully as Version ${published.version}.`,
      timetable: published,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation Error", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Failed to publish timetable.";
    const status = message.includes("Publish Rejected") ? 409 : 500;

    return NextResponse.json({ success: false, error: "Publish Error", message }, { status });
  }
}
