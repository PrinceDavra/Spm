import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { DEMO_TIMETABLES_STORE } from "@/lib/timetable/demo-timetable";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
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
        { success: false, error: "Forbidden", message: "Only administrators can view timetable versions." },
        { status: 403 }
      );
    }

    const { searchParams } = req.nextUrl;
    const divisionId = searchParams.get("divisionId") || "div-comp-a";

    const versions = DEMO_TIMETABLES_STORE.filter(
      (t) => t.divisionId === divisionId
    ).sort((a, b) => b.version - a.version);

    return NextResponse.json({
      success: true,
      versions,
    });
  } catch (error) {
    console.error("GET /api/timetable/versions Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Error", message: "Failed to load timetable versions." },
      { status: 500 }
    );
  }
}
