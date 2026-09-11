import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { Role } from "@prisma/client";

export const COOKIE_NAME = "campussphere_session";
const JWT_SECRET_STRING =
  process.env.JWT_SECRET || "campussphere-super-secure-jwt-secret-key-2026-evaluation-token";
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET_STRING);

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  departmentName?: string;
  designation?: string;
  rollNumber?: string;
  avatarUrl?: string | null;
}

export interface JWTPayloadData extends SessionUser {
  exp?: number;
  iat?: number;
}

/**
 * Creates a signed JWT session token valid for 7 days
 */
export async function createSessionToken(user: SessionUser): Promise<string> {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);

  return token;
}

/**
 * Verifies and decodes a signed JWT session token
 */
export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    const sessionUser: SessionUser = {
      id: payload.id as string,
      email: payload.email as string,
      role: payload.role as Role,
      firstName: payload.firstName as string,
      lastName: payload.lastName as string,
      departmentName: payload.departmentName as string | undefined,
      designation: payload.designation as string | undefined,
      rollNumber: payload.rollNumber as string | undefined,
      avatarUrl: (payload.avatarUrl as string | null) || null,
    };
    return sessionUser;
  } catch {
    return null;
  }
}

/**
 * Reads and verifies the current session from Next.js server cookie store
 */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);

  if (!sessionCookie?.value) {
    return null;
  }

  return verifySessionToken(sessionCookie.value);
}

/**
 * Sets the secure HTTP-only session cookie
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

/**
 * Clears the session cookie on logout
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
}
