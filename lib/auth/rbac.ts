import { Role } from "@prisma/client";
import { getSession, SessionUser } from "./session";
import { NextResponse } from "next/server";

export class AuthError extends Error {
  statusCode: number;
  constructor(message = "Unauthorized: Authentication required", statusCode = 401) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}

export class ForbiddenError extends Error {
  statusCode: number;
  constructor(message = "Forbidden: Insufficient permissions for this action", statusCode = 403) {
    super(message);
    this.name = "ForbiddenError";
    this.statusCode = statusCode;
  }
}

/**
 * Server-Side Authentication Guard:
 * Strictly verifies session token from HTTP-only cookie.
 * Throws AuthError(401) if not logged in.
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) {
    throw new AuthError("You must be logged in to access this resource", 401);
  }
  return user;
}

/**
 * Server-Side Role-Based Authorization Guard:
 * Strictly verifies session and checks if the authenticated user's role matches permitted roles.
 * Throws ForbiddenError(403) if role mismatch occurs.
 */
export async function requireRole(allowedRoles: Role[]): Promise<SessionUser> {
  const user = await requireAuth();

  if (!allowedRoles.includes(user.role)) {
    throw new ForbiddenError(
      `Access denied. Required role: [${allowedRoles.join(", ")}]. Current role: ${user.role}`,
      403
    );
  }

  return user;
}

/**
 * Helper to handle auth in API Route Handlers and return standardized JSON error responses
 */
export async function checkAuth(): Promise<
  { user: SessionUser; error: null } | { user: null; error: NextResponse }
> {
  const user = await getSession();
  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "You must be logged in to perform this operation",
        },
        { status: 401 }
      ),
    };
  }
  return { user, error: null };
}

/**
 * Helper to handle role check in API Route Handlers and return standardized JSON error responses
 */
export async function checkRole(
  allowedRoles: Role[]
): Promise<
  { user: SessionUser; error: null } | { user: null; error: NextResponse }
> {
  const authResult = await checkAuth();
  if (authResult.error) {
    return authResult;
  }

  const { user } = authResult;
  if (!allowedRoles.includes(user.role)) {
    return {
      user: null,
      error: NextResponse.json(
        {
          success: false,
          error: "Forbidden",
          message: `Access denied. Role ${user.role} is not permitted to access this endpoint.`,
          requiredRoles: allowedRoles,
        },
        { status: 403 }
      ),
    };
  }

  return { user, error: null };
}
