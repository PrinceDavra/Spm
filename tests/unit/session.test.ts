import { describe, it, expect } from "vitest";
import { createSessionToken, verifySessionToken, SessionUser } from "@/lib/auth/session";
import { Role } from "@prisma/client";

describe("JWT Session Management (jose)", () => {
  const mockUser: SessionUser = {
    id: "user-test-uuid",
    email: "student@campussphere.edu",
    role: Role.STUDENT,
    firstName: "Aarav",
    lastName: "Mehta",
    departmentName: "Computer Engineering",
    rollNumber: "22COMPA101",
  };

  it("should generate a valid signed JWT and verify payload integrity", async () => {
    const token = await createSessionToken(mockUser);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3); // JWT structure: header.payload.signature

    const verifiedUser = await verifySessionToken(token);
    expect(verifiedUser).not.toBeNull();
    expect(verifiedUser?.id).toBe(mockUser.id);
    expect(verifiedUser?.email).toBe(mockUser.email);
    expect(verifiedUser?.role).toBe(Role.STUDENT);
    expect(verifiedUser?.firstName).toBe(mockUser.firstName);
  });

  it("should return null for tampered or invalid tokens", async () => {
    const token = await createSessionToken(mockUser);
    // Tamper with signature
    const tampered = token.slice(0, -5) + "abcde";

    const result = await verifySessionToken(tampered);
    expect(result).toBeNull();

    const garbageResult = await verifySessionToken("not-a-token-at-all");
    expect(garbageResult).toBeNull();
  });
});
