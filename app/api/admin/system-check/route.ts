import { NextResponse } from "next/server";
import { checkRole } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";

export async function GET() {
  const guard = await checkRole([Role.ADMIN]);
  if (guard.error) {
    return guard.error;
  }

  return NextResponse.json({
    success: true,
    message: "Admin authorization verified. System operational.",
    operator: {
      id: guard.user.id,
      email: guard.user.email,
      role: guard.user.role,
      name: `${guard.user.firstName} ${guard.user.lastName}`,
    },
    system: {
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      rbacStatus: "STRICT_SERVER_VERIFIED",
    },
  });
}
