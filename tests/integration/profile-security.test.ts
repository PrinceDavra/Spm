import { describe, it, expect } from "vitest";
import { ProfileService } from "@/services/profile.service";
import { DEMO_USERS } from "@/lib/auth/demo-users";
import { Role } from "@prisma/client";

describe("Profile Module & Server-Side Security Tests (Phase 3)", () => {
  const studentDemo = DEMO_USERS.find((u) => u.role === Role.STUDENT)!;
  const facultyDemo = DEMO_USERS.find((u) => u.role === Role.FACULTY)!;

  // Test 1: Authenticated user can fetch own profile
  it("1. should fetch complete profile for authenticated student", async () => {
    const profile = await ProfileService.getProfile(studentDemo.id);

    expect(profile).not.toBeNull();
    expect(profile?.id).toBe(studentDemo.id);
    expect(profile?.email).toBe(studentDemo.email);
    expect(profile?.student?.rollNumber).toBe(studentDemo.rollNumber);
    expect(profile?.student?.prnNumber).toBe(studentDemo.prnNumber);
    expect(profile?.student?.department).toBe(studentDemo.departmentName);
    expect(profile?.student?.semester).toBe(studentDemo.semester);
  });

  // Test 2: Unauthenticated / unknown user check
  it("2. should return null when user profile does not exist", async () => {
    const profile = await ProfileService.getProfile("non-existent-user-id");
    expect(profile).toBeNull();
  });

  // Test 3: Student can update allowed fields (phone, bio, skills, avatarUrl)
  it("3. should allow student to update permitted fields", async () => {
    const newPhone = "+91 91234 56789";
    const newBio = "Updated bio for academic portfolio test.";
    const newSkills = ["React", "Next.js", "Docker", "Algorithms", "PostgreSQL"];

    const updated = await ProfileService.updateStudentProfile(studentDemo.id, {
      phone: newPhone,
      bio: newBio,
      skills: newSkills,
    });

    expect(updated.phone).toBe(newPhone);
    expect(updated.student?.bio).toBe(newBio);
    expect(updated.student?.skills).toEqual(newSkills);
  });

  // Test 4: Student cannot modify roll number
  it("4. should strictly reject student attempting to modify roll number", async () => {
    await expect(
      ProfileService.updateStudentProfile(studentDemo.id, {
        phone: "+91 99999 88888",
        rollNumber: "99HACKED001",
      } as any)
    ).rejects.toThrow(/Cannot modify immutable field 'rollNumber'/i);
  });

  // Test 5: Student cannot modify PRN
  it("5. should strictly reject student attempting to modify PRN", async () => {
    await expect(
      ProfileService.updateStudentProfile(studentDemo.id, {
        prnNumber: "PRN9999999999",
      } as any)
    ).rejects.toThrow(/Cannot modify immutable field 'prnNumber'/i);
  });

  // Test 6: Student cannot modify department
  it("6. should strictly reject student attempting to modify department", async () => {
    await expect(
      ProfileService.updateStudentProfile(studentDemo.id, {
        department: "Mechanical Engineering",
      } as any)
    ).rejects.toThrow(/Cannot modify immutable field 'department'/i);
  });

  // Test 7: Student cannot modify semester
  it("7. should strictly reject student attempting to modify semester", async () => {
    await expect(
      ProfileService.updateStudentProfile(studentDemo.id, {
        semester: 8,
      } as any)
    ).rejects.toThrow(/Cannot modify immutable field 'semester'/i);
  });

  // Test 8: Student cannot modify division
  it("8. should strictly reject student attempting to modify division", async () => {
    await expect(
      ProfileService.updateStudentProfile(studentDemo.id, {
        division: "Division Z",
      } as any)
    ).rejects.toThrow(/Cannot modify immutable field 'division'/i);
  });

  // Test 9: Student cannot modify email
  it("9. should strictly reject student attempting to modify email", async () => {
    await expect(
      ProfileService.updateStudentProfile(studentDemo.id, {
        email: "hacked_email@external.com",
      } as any)
    ).rejects.toThrow(/Cannot modify immutable field 'email'/i);
  });

  // Test 10: Faculty can update permitted fields (officeRoom, qualification, specialization, phone)
  it("10. should allow faculty to update permitted fields", async () => {
    const newOffice = "Room 512, High Performance Computing Wing";
    const newSpec = "Distributed Consensus & Fault Tolerant Architectures";

    const updated = await ProfileService.updateFacultyProfile(facultyDemo.id, {
      officeRoom: newOffice,
      specialization: newSpec,
      phone: "+91 98888 77777",
    });

    expect(updated.faculty?.officeRoom).toBe(newOffice);
    expect(updated.faculty?.specialization).toBe(newSpec);
    expect(updated.phone).toBe("+91 98888 77777");
  });

  // Test 11: Faculty cannot modify employee ID or designation
  it("11. should reject faculty attempting to modify employee ID or designation", async () => {
    await expect(
      ProfileService.updateFacultyProfile(facultyDemo.id, {
        employeeId: "EMP-HACKED-001",
      } as any)
    ).rejects.toThrow(/Cannot modify immutable field 'employeeId'/i);

    await expect(
      ProfileService.updateFacultyProfile(facultyDemo.id, {
        designation: "Dean of Academic Affairs",
      } as any)
    ).rejects.toThrow(/Cannot modify immutable field 'designation'/i);
  });

  // Test 12: Invalid input is rejected by validation schema
  it("12. should reject invalid phone formats or excessively long bios", async () => {
    // Phone too short
    await expect(
      ProfileService.updateStudentProfile(studentDemo.id, {
        phone: "123",
      })
    ).rejects.toThrow();

    // Bio exceeding 500 characters
    const longBio = "A".repeat(501);
    await expect(
      ProfileService.updateStudentProfile(studentDemo.id, {
        bio: longBio,
      })
    ).rejects.toThrow();
  });

  // Test 13: Profile changes persist across subsequent reads
  it("13. should persist changes across subsequent getProfile reads", async () => {
    const updatedBio = "Persistent Bio Validation Check 2026";
    await ProfileService.updateStudentProfile(studentDemo.id, {
      bio: updatedBio,
    });

    const readBack = await ProfileService.getProfile(studentDemo.id);
    expect(readBack?.student?.bio).toBe(updatedBio);
  });
});
