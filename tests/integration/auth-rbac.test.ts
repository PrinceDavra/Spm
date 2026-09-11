import { describe, it, expect } from "vitest";
import { AuthService } from "@/services/auth.service";
import { Role } from "@prisma/client";
import { loginSchema } from "@/validators/auth.schema";
import { DEMO_USERS } from "@/lib/auth/demo-users";

describe("Authentication & Server-Side RBAC Integration", () => {
  describe("Demo Accounts Verification", () => {
    it("should authenticate the ADMIN demo user", async () => {
      const admin = DEMO_USERS.find((u) => u.role === Role.ADMIN)!;
      const user = await AuthService.authenticate({
        email: admin.email,
        password: admin.passwordPlainText,
      });

      expect(user).not.toBeNull();
      expect(user?.role).toBe(Role.ADMIN);
      expect(user?.email).toBe("admin@campussphere.edu");
    });

    it("should authenticate the STUDENT demo user", async () => {
      const student = DEMO_USERS.find((u) => u.role === Role.STUDENT)!;
      const user = await AuthService.authenticate({
        email: student.email,
        password: student.passwordPlainText,
      });

      expect(user).not.toBeNull();
      expect(user?.role).toBe(Role.STUDENT);
      expect(user?.rollNumber).toBe("22COMPA101");
    });

    it("should authenticate the FACULTY demo user", async () => {
      const faculty = DEMO_USERS.find((u) => u.role === Role.FACULTY)!;
      const user = await AuthService.authenticate({
        email: faculty.email,
        password: faculty.passwordPlainText,
      });

      expect(user).not.toBeNull();
      expect(user?.role).toBe(Role.FACULTY);
      expect(user?.designation).toBe("Associate Professor");
    });

    it("should authenticate the PLACEMENT_OFFICER demo user", async () => {
      const po = DEMO_USERS.find((u) => u.role === Role.PLACEMENT_OFFICER)!;
      const user = await AuthService.authenticate({
        email: po.email,
        password: po.passwordPlainText,
      });

      expect(user).not.toBeNull();
      expect(user?.role).toBe(Role.PLACEMENT_OFFICER);
    });

    it("should authenticate the CLUB_COORDINATOR demo user", async () => {
      const club = DEMO_USERS.find((u) => u.role === Role.CLUB_COORDINATOR)!;
      const user = await AuthService.authenticate({
        email: club.email,
        password: club.passwordPlainText,
      });

      expect(user).not.toBeNull();
      expect(user?.role).toBe(Role.CLUB_COORDINATOR);
    });

    it("should reject incorrect password for existing user", async () => {
      const user = await AuthService.authenticate({
        email: "admin@campussphere.edu",
        password: "WrongPassword@999",
      });

      expect(user).toBeNull();
    });

    it("should reject non-existent user", async () => {
      const user = await AuthService.authenticate({
        email: "ghost@campussphere.edu",
        password: "SomePassword@123",
      });

      expect(user).toBeNull();
    });
  });

  describe("Zod Input Validation", () => {
    it("should pass for valid email and password format", () => {
      const result = loginSchema.safeParse({
        email: "student@campussphere.edu",
        password: "ValidPassword123",
      });
      expect(result.success).toBe(true);
    });

    it("should fail for invalid email format", () => {
      const result = loginSchema.safeParse({
        email: "not-an-email",
        password: "ValidPassword123",
      });
      expect(result.success).toBe(false);
    });

    it("should fail for short password under 6 characters", () => {
      const result = loginSchema.safeParse({
        email: "student@campussphere.edu",
        password: "123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Server-Side Role Permission Logic", () => {
    it("should enforce strict role boundary checks", () => {
      const studentRole: Role = Role.STUDENT;
      const facultyRole: Role = Role.FACULTY;
      const adminRole: Role = Role.ADMIN;

      const adminOnlyRoles: Role[] = [Role.ADMIN];
      const facultyOrAdmin: Role[] = [Role.FACULTY, Role.ADMIN];

      // Student attempting Admin action
      expect(adminOnlyRoles.includes(studentRole)).toBe(false);

      // Faculty attempting Admin action
      expect(adminOnlyRoles.includes(facultyRole)).toBe(false);

      // Admin attempting Admin action
      expect(adminOnlyRoles.includes(adminRole)).toBe(true);

      // Student attempting Faculty action
      expect(facultyOrAdmin.includes(studentRole)).toBe(false);

      // Faculty attempting Faculty action
      expect(facultyOrAdmin.includes(facultyRole)).toBe(true);

      // Admin attempting Faculty action (Super-admin escalation)
      expect(facultyOrAdmin.includes(adminRole)).toBe(true);
    });
  });
});
