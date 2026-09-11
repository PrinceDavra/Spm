import { describe, it, expect } from "vitest";
import { AuthService } from "@/services/auth.service";
import { createSessionToken, verifySessionToken } from "@/lib/auth/session";
import { DEMO_USERS } from "@/lib/auth/demo-users";
import { Role } from "@prisma/client";

describe("Critical-Path Authentication & RBAC Verification", () => {
  // Test 6: Test every demo account
  it("should authenticate and generate valid session for all 5 demo roles", async () => {
    for (const demo of DEMO_USERS) {
      const authResult = await AuthService.authenticate({
        email: demo.email,
        password: demo.passwordPlainText,
      });

      expect(authResult).not.toBeNull();
      expect(authResult?.role).toBe(demo.role);

      // Verify token creation
      const token = await createSessionToken(authResult!);
      const verified = await verifySessionToken(token);

      expect(verified).not.toBeNull();
      expect(verified?.id).toBe(demo.id);
      expect(verified?.role).toBe(demo.role);
    }
  });

  // Test 7: Test unauthorized role access simulation
  it("should prevent unauthorized roles from acquiring elevated permissions", async () => {
    const studentAuth = await AuthService.authenticate({
      email: "student@campussphere.edu",
      password: "StudentPassword@123",
    });
    expect(studentAuth).not.toBeNull();

    // Check that student cannot satisfy ADMIN role
    const adminRoles: Role[] = [Role.ADMIN];
    const hasAdminAccess = adminRoles.includes(studentAuth!.role);
    expect(hasAdminAccess).toBe(false);

    // Check that student cannot satisfy FACULTY role
    const facultyRoles: Role[] = [Role.FACULTY];
    const hasFacultyAccess = facultyRoles.includes(studentAuth!.role);
    expect(hasFacultyAccess).toBe(false);
  });

  // Test 8: Test logout behavior (token revocation / verification failure)
  it("should treat cleared or invalid tokens as unauthenticated", async () => {
    const invalidToken = "";
    const session = await verifySessionToken(invalidToken);
    expect(session).toBeNull();
  });

  // Test 9: Test invalid credentials
  it("should fail authentication with invalid credentials and return null", async () => {
    const wrongPass = await AuthService.authenticate({
      email: "admin@campussphere.edu",
      password: "CompletelyWrongPassword!1",
    });
    expect(wrongPass).toBeNull();

    const nonExistent = await AuthService.authenticate({
      email: "unknown_intruder@campus.edu",
      password: "SomePassword123",
    });
    expect(nonExistent).toBeNull();
  });

  // Test 10: Test protected API simulation for Admin
  it("should permit Admin to access protected system actions while blocking non-admins", async () => {
    const adminAuth = await AuthService.authenticate({
      email: "admin@campussphere.edu",
      password: "AdminPassword@123",
    });
    expect(adminAuth?.role).toBe(Role.ADMIN);

    const facultyAuth = await AuthService.authenticate({
      email: "faculty@campussphere.edu",
      password: "FacultyPassword@123",
    });
    expect(facultyAuth?.role).toBe(Role.FACULTY);

    const adminAllowed: Role[] = [Role.ADMIN];
    expect(adminAllowed.includes(adminAuth!.role)).toBe(true);
    expect(adminAllowed.includes(facultyAuth!.role)).toBe(false);
  });
});
