import { prisma } from "@/lib/prisma";
import { DEMO_USERS } from "@/lib/auth/demo-users";
import { isDatabaseOnline } from "@/lib/db-health";
import {
  STUDENT_IMMUTABLE_FIELDS,
  FACULTY_IMMUTABLE_FIELDS,
  updateStudentProfileSchema,
  updateFacultyProfileSchema,
  UpdateStudentProfileInput,
  UpdateFacultyProfileInput,
} from "@/validators/profile.schema";
import { Role } from "@prisma/client";

export interface UnifiedProfile {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: Date | string;
  student?: {
    studentId: string;
    rollNumber: string;
    prnNumber: string;
    department: string;
    semester: number;
    division: string;
    batchYear: string;
    cgpa: number;
    skills: string[];
    bio: string;
  };
  faculty?: {
    facultyId: string;
    employeeId: string;
    department: string;
    designation: string;
    qualification: string;
    specialization: string;
    officeRoom: string;
    bio?: string;
  };
}

export class ProfileService {
  /**
   * Retrieves profile by user ID. Checks PostgreSQL first if online; falls back to demo store.
   */
  static async getProfile(userId: string): Promise<UnifiedProfile | null> {
    const isOnline = await isDatabaseOnline();

    if (isOnline) {
      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            studentProfile: {
              include: {
                department: true,
                division: true,
              },
            },
            facultyProfile: {
              include: {
                department: true,
              },
            },
          },
        });

        if (dbUser) {
          return {
            id: dbUser.id,
            email: dbUser.email,
            role: dbUser.role,
            firstName: dbUser.firstName,
            lastName: dbUser.lastName,
            fullName: `${dbUser.firstName} ${dbUser.lastName}`,
            phone: dbUser.phone || "",
            avatarUrl: dbUser.avatarUrl,
            isActive: dbUser.isActive,
            createdAt: dbUser.createdAt,
            student: dbUser.studentProfile
              ? {
                  studentId: dbUser.studentProfile.id,
                  rollNumber: dbUser.studentProfile.rollNumber,
                  prnNumber: dbUser.studentProfile.prnNumber,
                  department: dbUser.studentProfile.department.name,
                  semester: dbUser.studentProfile.semester,
                  division: dbUser.studentProfile.division.name,
                  batchYear: dbUser.studentProfile.batchYear,
                  cgpa: dbUser.studentProfile.cgpa,
                  skills: dbUser.studentProfile.skills,
                  bio: dbUser.studentProfile.bio || "",
                }
              : undefined,
            faculty: dbUser.facultyProfile
              ? {
                  facultyId: dbUser.facultyProfile.id,
                  employeeId: dbUser.facultyProfile.employeeId,
                  department: dbUser.facultyProfile.department.name,
                  designation: dbUser.facultyProfile.designation,
                  qualification: dbUser.facultyProfile.qualification,
                  specialization: dbUser.facultyProfile.specialization,
                  officeRoom: dbUser.facultyProfile.officeRoom || "",
                }
              : undefined,
          };
        }
      } catch {
        // Fall through to demo store
      }
    }

    // Fallback to Demo Catalog
    const demo = DEMO_USERS.find((u) => u.id === userId);
    if (!demo) return null;

    return {
      id: demo.id,
      email: demo.email,
      role: demo.role,
      firstName: demo.firstName,
      lastName: demo.lastName,
      fullName: `${demo.firstName} ${demo.lastName}`,
      phone: demo.phone,
      avatarUrl: demo.avatarUrl || null,
      isActive: true,
      createdAt: new Date("2024-08-01"),
      student:
        demo.role === Role.STUDENT
          ? {
              studentId: demo.studentId || "STU-2022-0101",
              rollNumber: demo.rollNumber || "22COMPA101",
              prnNumber: demo.prnNumber || "PRN2022014589",
              department: demo.departmentName || "Computer Engineering",
              semester: demo.semester || 6,
              division: demo.division || "Division A",
              batchYear: demo.batchYear || "2022-2026",
              cgpa: demo.cgpa || 8.74,
              skills: demo.skills || [],
              bio: demo.bio || "",
            }
          : undefined,
      faculty:
        demo.role === Role.FACULTY
          ? {
              facultyId: demo.facultyId || "FAC-2018-042",
              employeeId: demo.employeeId || "EMP-CS-042",
              department: demo.departmentName || "Computer Engineering",
              designation: demo.designation || "Associate Professor",
              qualification: demo.qualification || "Ph.D. in Computer Science",
              specialization: demo.specialization || "Distributed Systems",
              officeRoom: demo.officeRoom || "Room 408",
              bio: demo.bio || "",
            }
          : undefined,
    };
  }

  /**
   * Updates student profile with strict server-side validation and immutability checks
   */
  static async updateStudentProfile(
    userId: string,
    rawBody: Record<string, unknown>
  ): Promise<UnifiedProfile> {
    // 1. Strict server-side immutable fields rejection
    for (const field of STUDENT_IMMUTABLE_FIELDS) {
      if (rawBody[field] !== undefined) {
        throw new Error(
          `Security Violation: Cannot modify immutable field '${field}'. Student academic records are institutionally locked.`
        );
      }
    }

    // 2. Validate permitted fields via Zod
    const validatedInput: UpdateStudentProfileInput = updateStudentProfileSchema.parse(rawBody);

    // 3. Attempt Database Update if online
    const isOnline = await isDatabaseOnline();
    if (isOnline) {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { id: userId },
            data: {
              phone: validatedInput.phone !== undefined ? validatedInput.phone : undefined,
              avatarUrl: validatedInput.avatarUrl !== undefined ? validatedInput.avatarUrl : undefined,
            },
          });

          await tx.student.update({
            where: { userId },
            data: {
              bio: validatedInput.bio !== undefined ? validatedInput.bio : undefined,
              skills: validatedInput.skills !== undefined ? validatedInput.skills : undefined,
            },
          });

          await tx.auditLog.create({
            data: {
              userId,
              action: "UPDATE_STUDENT_PROFILE",
              entity: "Student",
              entityId: userId,
              details: { updatedFields: Object.keys(validatedInput) },
            },
          });
        });

        const updated = await this.getProfile(userId);
        if (updated) return updated;
      } catch (dbError: unknown) {
        if (dbError instanceof Error && dbError.message.startsWith("Security Violation")) {
          throw dbError;
        }
      }
    }

    // 4. Update in-memory Demo Store
    const demo = DEMO_USERS.find((u) => u.id === userId);
    if (!demo) {
      throw new Error("User profile not found.");
    }

    if (validatedInput.phone !== undefined) demo.phone = validatedInput.phone;
    if (validatedInput.avatarUrl !== undefined) demo.avatarUrl = validatedInput.avatarUrl;
    if (validatedInput.bio !== undefined) demo.bio = validatedInput.bio;
    if (validatedInput.skills !== undefined) demo.skills = validatedInput.skills;

    return (await this.getProfile(userId))!;
  }

  /**
   * Updates faculty profile with strict server-side validation and immutability checks
   */
  static async updateFacultyProfile(
    userId: string,
    rawBody: Record<string, unknown>
  ): Promise<UnifiedProfile> {
    // 1. Strict server-side immutable fields rejection
    for (const field of FACULTY_IMMUTABLE_FIELDS) {
      if (rawBody[field] !== undefined) {
        throw new Error(
          `Security Violation: Cannot modify immutable field '${field}'. Faculty appointments and designations are governed by administration.`
        );
      }
    }

    // 2. Validate permitted fields via Zod
    const validatedInput: UpdateFacultyProfileInput = updateFacultyProfileSchema.parse(rawBody);

    // 3. Attempt Database Update if online
    const isOnline = await isDatabaseOnline();
    if (isOnline) {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { id: userId },
            data: {
              phone: validatedInput.phone !== undefined ? validatedInput.phone : undefined,
              avatarUrl: validatedInput.avatarUrl !== undefined ? validatedInput.avatarUrl : undefined,
            },
          });

          await tx.faculty.update({
            where: { userId },
            data: {
              officeRoom: validatedInput.officeRoom !== undefined ? validatedInput.officeRoom : undefined,
              qualification: validatedInput.qualification !== undefined ? validatedInput.qualification : undefined,
              specialization: validatedInput.specialization !== undefined ? validatedInput.specialization : undefined,
            },
          });

          await tx.auditLog.create({
            data: {
              userId,
              action: "UPDATE_FACULTY_PROFILE",
              entity: "Faculty",
              entityId: userId,
              details: { updatedFields: Object.keys(validatedInput) },
            },
          });
        });

        const updated = await this.getProfile(userId);
        if (updated) return updated;
      } catch (dbError: unknown) {
        if (dbError instanceof Error && dbError.message.startsWith("Security Violation")) {
          throw dbError;
        }
      }
    }

    // 4. Update in-memory Demo Store
    const demo = DEMO_USERS.find((u) => u.id === userId);
    if (!demo) {
      throw new Error("User profile not found.");
    }

    if (validatedInput.phone !== undefined) demo.phone = validatedInput.phone;
    if (validatedInput.avatarUrl !== undefined) demo.avatarUrl = validatedInput.avatarUrl;
    if (validatedInput.officeRoom !== undefined) demo.officeRoom = validatedInput.officeRoom;
    if (validatedInput.qualification !== undefined) demo.qualification = validatedInput.qualification;
    if (validatedInput.specialization !== undefined) demo.specialization = validatedInput.specialization;

    return (await this.getProfile(userId))!;
  }
}
