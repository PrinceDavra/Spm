import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/session";

export async function POST() {
  try {
    await clearSessionCookie();

    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "An unexpected error occurred during logout.",
      },
      { status: 500 }
    );
  }
}
