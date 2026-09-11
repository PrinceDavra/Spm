import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/validators/auth.schema";
import { AuthService } from "@/services/auth.service";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = loginSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation Failed",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const user = await AuthService.authenticate(parseResult.data);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid Credentials",
          message: "The email or password you entered is incorrect.",
        },
        { status: 401 }
      );
    }

    // Generate signed JWT session token
    const token = await createSessionToken(user);

    // Set secure HTTP-only SameSite cookie
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        departmentName: user.departmentName,
        designation: user.designation,
        rollNumber: user.rollNumber,
      },
    });
  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "An unexpected error occurred during authentication.",
      },
      { status: 500 }
    );
  }
}
