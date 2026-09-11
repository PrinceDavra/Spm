import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessionCookie = req.cookies.get(COOKIE_NAME);
  const token = sessionCookie?.value;

  const user = token ? await verifySessionToken(token) : null;

  // 1. Redirection if user is already logged in and visits /login
  if (pathname === "/login") {
    if (user) {
      const redirectMap: Record<string, string> = {
        STUDENT: "/dashboard/student",
        FACULTY: "/dashboard/faculty",
        ADMIN: "/dashboard/admin",
        PLACEMENT_OFFICER: "/dashboard/placement",
        CLUB_COORDINATOR: "/dashboard/club",
      };
      const destination = redirectMap[user.role] || "/dashboard/student";
      return NextResponse.redirect(new URL(destination, req.url));
    }
    return NextResponse.next();
  }

  // 2. Protection for all /dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!user) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based route authorization
    if (pathname.startsWith("/dashboard/admin") && user.role !== "ADMIN") {
      return NextResponse.redirect(
        new URL(`/unauthorized?required=ADMIN&current=${user.role}`, req.url)
      );
    }

    if (
      pathname.startsWith("/dashboard/student") &&
      user.role !== "STUDENT" &&
      user.role !== "ADMIN"
    ) {
      return NextResponse.redirect(
        new URL(`/unauthorized?required=STUDENT&current=${user.role}`, req.url)
      );
    }

    if (
      pathname.startsWith("/dashboard/faculty") &&
      user.role !== "FACULTY" &&
      user.role !== "ADMIN"
    ) {
      return NextResponse.redirect(
        new URL(`/unauthorized?required=FACULTY&current=${user.role}`, req.url)
      );
    }

    if (
      pathname.startsWith("/dashboard/placement") &&
      user.role !== "PLACEMENT_OFFICER" &&
      user.role !== "ADMIN"
    ) {
      return NextResponse.redirect(
        new URL(`/unauthorized?required=PLACEMENT_OFFICER&current=${user.role}`, req.url)
      );
    }

    if (
      pathname.startsWith("/dashboard/club") &&
      user.role !== "CLUB_COORDINATOR" &&
      user.role !== "ADMIN"
    ) {
      return NextResponse.redirect(
        new URL(`/unauthorized?required=CLUB_COORDINATOR&current=${user.role}`, req.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
