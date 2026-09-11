import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("Password Hashing & Verification (bcryptjs)", () => {
  it("should hash a password with salt and verify successfully", async () => {
    const rawPassword = "TestSecurePassword@2026";
    const hash = await hashPassword(rawPassword);

    expect(hash).toBeDefined();
    expect(hash.startsWith("$2a$") || hash.startsWith("$2b$")).toBe(true);

    const isMatch = await verifyPassword(rawPassword, hash);
    expect(isMatch).toBe(true);
  });

  it("should reject an incorrect password", async () => {
    const rawPassword = "CorrectPassword123";
    const wrongPassword = "WrongPassword456";
    const hash = await hashPassword(rawPassword);

    const isMatch = await verifyPassword(wrongPassword, hash);
    expect(isMatch).toBe(false);
  });
});
