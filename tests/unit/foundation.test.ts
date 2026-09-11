import { describe, it, expect } from "vitest";
import { cn, formatDate, formatDateTime, capitalize } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

describe("Foundation Unit Tests", () => {
  it("should merge tailwind class names correctly", () => {
    const result = cn("p-4 text-red-500", "p-2", { "bg-blue-500": true, "hidden": false });
    expect(result).toBe("text-red-500 p-2 bg-blue-500");
  });

  it("should capitalize string accurately", () => {
    expect(capitalize("student")).toBe("Student");
    expect(capitalize("FACULTY")).toBe("Faculty");
    expect(capitalize("")).toBe("");
  });

  it("should format dates cleanly", () => {
    const testDate = new Date("2026-10-15T10:30:00Z");
    const formatted = formatDate(testDate);
    expect(formatted).toContain("2026");
    expect(formatted).toContain("Oct");
  });

  it("should instantiate Prisma Client without error", () => {
    expect(prisma).toBeDefined();
    expect(typeof prisma.$connect).toBe("function");
  });
});
