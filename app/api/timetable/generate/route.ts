import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { TimetableService } from "@/services/timetable.service";
import { generateTimetableSchema } from "@/validators/timetable.schema";
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
        { success: false, error: "Forbidden", message: "Only administrators can run the timetable generator." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = generateTimetableSchema.parse(body);

    const result = await TimetableService.generateTimetable(user.id, validatedData);

    return NextResponse.json({
      success: result.success,
      result,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation Error", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Timetable generation failed.";
    return NextResponse.json({ success: false, error: "Generation Error", message }, { status: 500 });
  }
}
