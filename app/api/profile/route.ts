import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { ProfileService } from "@/services/profile.service";
import { Role } from "@prisma/client";
import { ZodError } from "zod";

/**
 * GET /api/profile
 * Retrieves the profile of the currently authenticated session user
 */
export async function GET() {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "You must be logged in to access profile data.",
        },
        { status: 401 }
      );
    }

    const profile = await ProfileService.getProfile(user.id);

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: "Not Found",
          message: "User profile record could not be found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error("GET /api/profile Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to retrieve profile.",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/profile
 * Updates permitted profile fields based on the authenticated user's role
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "You must be logged in to update your profile.",
        },
        { status: 401 }
      );
    }

    const rawBody = await req.json();

    let updatedProfile;

    if (user.role === Role.STUDENT) {
      updatedProfile = await ProfileService.updateStudentProfile(user.id, rawBody);
    } else if (user.role === Role.FACULTY) {
      updatedProfile = await ProfileService.updateFacultyProfile(user.id, rawBody);
    } else if (user.role === Role.ADMIN) {
      // Admin has permission to update contact info
      updatedProfile = await ProfileService.updateFacultyProfile(user.id, rawBody);
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
          message: `Role ${user.role} is not configured for self-service profile modification.`,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
      profile: updatedProfile,
    });
  } catch (error: unknown) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation Error",
          details: error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Handle security immutability violations
    if (error instanceof Error && error.message.includes("Security Violation")) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden Field Modification",
          message: error.message,
        },
        { status: 400 }
      );
    }

    console.error("PATCH /api/profile Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Failed to update profile.",
      },
      { status: 500 }
    );
  }
}
