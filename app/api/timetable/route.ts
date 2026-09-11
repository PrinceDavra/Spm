import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { TimetableService } from "@/services/timetable.service";

export async function GET(req: NextRequest) {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", message: "Login required." },
        { status: 401 }
      );
    }

    const { searchParams } = req.nextUrl;
    const divisionId = searchParams.get("divisionId") || "div-comp-a";

    const config = await TimetableService.getAcademicConfiguration(divisionId);

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error("GET /api/timetable Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Error", message: "Failed to load timetable config." },
      { status: 500 }
    );
  }
}
