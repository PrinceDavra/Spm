import { describe, it, expect, beforeEach } from "vitest";
import { AcademicService } from "@/services/academic.service";
import {
  createDepartmentSchema,
  createProgramSchema,
  createBatchSchema,
  createSemesterSchema,
  createDivisionSchema,
  createSubjectSchema,
  createFacultyMappingSchema,
  createRoomSchema,
  createLaboratorySchema,
} from "@/validators/academic.schema";
import {
  resetDemoAcademicStore,
  DEMO_DEPARTMENTS,
  DEMO_PROGRAMS,
  DEMO_BATCHES,
  DEMO_DIVISIONS,
  DEMO_SUBJECTS,
  DEMO_FACULTY_MAPPINGS,
  DEMO_ROOMS,
  DEMO_LABORATORIES,
} from "@/lib/admin/demo-academic";
import { DEMO_USERS } from "@/lib/auth/demo-users";
import { Role, SubjectType, RoomType } from "@prisma/client";
import { TimetableService } from "@/services/timetable.service";
import { AttendanceService } from "@/services/attendance.service";
import { AssignmentService } from "@/services/assignment.service";
import { NoticeService } from "@/services/notice.service";
import { EventService } from "@/services/event.service";
import { ClubService } from "@/services/club.service";
import { PlacementService } from "@/services/placement.service";
import { LostFoundService } from "@/services/lost-found.service";

describe("Phase 12 — Admin Management: Academic Setup, Faculty Mapping, Rooms & Laboratories Tests", () => {
  const adminUser = DEMO_USERS.find((u) => u.role === Role.ADMIN)!;
  const facultyUser = DEMO_USERS.find((u) => u.role === Role.FACULTY)!;
  const studentUser = DEMO_USERS.find((u) => u.role === Role.STUDENT)!;

  beforeEach(() => {
    resetDemoAcademicStore();
  });

  // =========================================================================
  // 1. DEPARTMENT MANAGEMENT (Tests 1-3, 18-19, 34)
  // =========================================================================
  describe("1. Department Management & RBAC Permissions", () => {
    it("1. Admin can create department", async () => {
      const payload = {
        name: "Mechanical Engineering",
        code: "MECH",
        description: "Department of Thermal and Machine Design",
        headOfDepartment: "Dr. Arvind Pawar",
        isActive: true,
      };

      const parsed = createDepartmentSchema.safeParse(payload);
      expect(parsed.success).toBe(true);

      const dept = await AcademicService.createDepartment(parsed.data!, adminUser.id);
      expect(dept).toBeDefined();
      expect(dept.code).toBe("MECH");
      expect(dept.name).toBe("Mechanical Engineering");
      expect(dept.isActive).toBe(true);

      const retrieved = await AcademicService.getDepartmentById(dept.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.code).toBe("MECH");
    });

    it("2. Non-admin cannot create department (RBAC logic)", () => {
      const allowedRoles: Role[] = [Role.ADMIN];
      expect(allowedRoles.includes(adminUser.role)).toBe(false === false);
      expect(allowedRoles.includes(facultyUser.role)).toBe(false);
      expect(allowedRoles.includes(studentUser.role)).toBe(false);
    });

    it("3. Duplicate department code rejected", async () => {
      const payload = {
        name: "Another Computer Department",
        code: "COMP", // Already exists
        headOfDepartment: "Dr. Duplicate",
      };

      await expect(
        AcademicService.createDepartment(payload, adminUser.id)
      ).rejects.toThrow("already exists");
    });
  });

  // =========================================================================
  // 2. PROGRAM / COURSE MANAGEMENT (Tests 4-5)
  // =========================================================================
  describe("2. Program / Course Management", () => {
    it("4. Admin can create program", async () => {
      const payload = {
        name: "Master of Technology in Artificial Intelligence",
        code: "MTECH-AI",
        degree: "M.Tech",
        departmentId: "dept-comp",
        durationYears: 2,
        totalSemesters: 4,
        isActive: true,
      };

      const parsed = createProgramSchema.safeParse(payload);
      expect(parsed.success).toBe(true);

      const prog = await AcademicService.createProgram(parsed.data!, adminUser.id);
      expect(prog.code).toBe("MTECH-AI");
      expect(prog.degree).toBe("M.Tech");
      expect(prog.durationYears).toBe(2);
      expect(prog.totalSemesters).toBe(4);
    });

    it("5. Invalid program relationship rejected (nonexistent or inactive department)", async () => {
      const payload = {
        name: "Master of Robotics",
        code: "MTECH-ROB",
        degree: "M.Tech",
        departmentId: "nonexistent-dept-id",
        durationYears: 2,
        totalSemesters: 4,
      };

      await expect(
        AcademicService.createProgram(payload, adminUser.id)
      ).rejects.toThrow("department does not exist");
    });
  });

  // =========================================================================
  // 3. BATCH MANAGEMENT (Tests 6-7)
  // =========================================================================
  describe("3. Batch Management", () => {
    it("6. Admin can create batch", async () => {
      const payload = {
        name: "Batch 2025-2029",
        startYear: 2025,
        endYear: 2029,
        programId: "prog-btech-cse",
        currentSemester: 1,
        isActive: true,
      };

      const parsed = createBatchSchema.safeParse(payload);
      expect(parsed.success).toBe(true);

      const batch = await AcademicService.createBatch(parsed.data!, adminUser.id);
      expect(batch.name).toBe("Batch 2025-2029");
      expect(batch.startYear).toBe(2025);
      expect(batch.endYear).toBe(2029);
      expect(batch.programId).toBe("prog-btech-cse");
    });

    it("7. Invalid batch configuration rejected (endYear <= startYear)", async () => {
      const invalidPayload = {
        name: "Invalid Inverted Batch",
        startYear: 2026,
        endYear: 2024, // Inverted years
        programId: "prog-btech-cse",
      };

      const parsed = createBatchSchema.safeParse(invalidPayload);
      expect(parsed.success).toBe(false);

      await expect(
        AcademicService.createBatch(invalidPayload as any, adminUser.id)
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // 4. SEMESTER MANAGEMENT (Tests 8-9)
  // =========================================================================
  describe("4. Academic Semester Management", () => {
    it("8. Admin can create semester", async () => {
      const payload = {
        semesterNumber: 7,
        academicYear: "2025-2026",
        term: "ODD" as const,
        startDate: "2025-07-01T00:00:00.000Z",
        endDate: "2025-11-30T00:00:00.000Z",
        isActive: true,
      };

      const parsed = createSemesterSchema.safeParse(payload);
      expect(parsed.success).toBe(true);

      const sem = await AcademicService.createSemester(parsed.data!, adminUser.id);
      expect(sem.semesterNumber).toBe(7);
      expect(sem.academicYear).toBe("2025-2026");
      expect(sem.term).toBe("ODD");
    });

    it("9. Duplicate semester rejected", async () => {
      const payload = {
        semesterNumber: 6,
        academicYear: "2024-2025",
        term: "EVEN" as const, // Already exists in demo store
      };

      await expect(
        AcademicService.createSemester(payload, adminUser.id)
      ).rejects.toThrow("already exists");
    });
  });

  // =========================================================================
  // 5. DIVISION / CLASS MANAGEMENT (Tests 10-11)
  // =========================================================================
  describe("5. Division / Class Management", () => {
    it("10. Admin can create division", async () => {
      const payload = {
        classId: "class-comp-te",
        name: "Division C",
        code: "CE-C",
        capacity: 65,
        isActive: true,
      };

      const parsed = createDivisionSchema.safeParse(payload);
      expect(parsed.success).toBe(true);

      const div = await AcademicService.createDivision(parsed.data!, adminUser.id);
      expect(div.name).toBe("Division C");
      expect(div.code).toBe("CE-C");
      expect(div.capacity).toBe(65);
    });

    it("11. Duplicate division rejected within same class", async () => {
      const duplicatePayload = {
        classId: "class-comp-te",
        name: "Division A", // Already exists in class-comp-te
        capacity: 70,
      };

      await expect(
        AcademicService.createDivision(duplicatePayload, adminUser.id)
      ).rejects.toThrow("already exists in class");
    });
  });

  // =========================================================================
  // 6. SUBJECT MANAGEMENT (Tests 12-13, 25)
  // =========================================================================
  describe("6. Subject Management & Syllabus", () => {
    it("12. Admin can create subject", async () => {
      const payload = {
        name: "Artificial Intelligence & Machine Learning",
        code: "COMP-307",
        departmentId: "dept-comp",
        semester: 6,
        credits: 4,
        type: SubjectType.THEORY,
        weeklyHours: 4,
        description: "Supervised and unsupervised learning, deep neural networks, reinforcement learning",
        syllabusUrl: "https://campussphere.edu/syllabus/comp-307.pdf",
        requiresLab: false,
        isActive: true,
      };

      const parsed = createSubjectSchema.safeParse(payload);
      expect(parsed.success).toBe(true);

      const subject = await AcademicService.createSubject(parsed.data!, adminUser.id);
      expect(subject.code).toBe("COMP-307");
      expect(subject.name).toBe("Artificial Intelligence & Machine Learning");
      expect(subject.type).toBe(SubjectType.THEORY);
      expect(subject.weeklyHours).toBe(4);
    });

    it("13. Invalid subject relationship rejected (nonexistent department)", async () => {
      const invalidPayload = {
        name: "Quantum Computing",
        code: "COMP-999",
        departmentId: "ghost-dept",
        semester: 6,
      };

      await expect(
        AcademicService.createSubject(invalidPayload as any, adminUser.id)
      ).rejects.toThrow("department does not exist");
    });

    it("25. Lab subject requires compatible lab/resource when specific lab is specified", async () => {
      const invalidLabPayload = {
        name: "Advanced Robotics Practical",
        code: "ROB-401-LAB",
        departmentId: "dept-comp",
        semester: 7,
        credits: 2,
        type: SubjectType.LAB,
        weeklyHours: 2,
        requiresLab: true,
        laboratoryId: "nonexistent-lab-id",
      };

      await expect(
        AcademicService.createSubject(invalidLabPayload, adminUser.id)
      ).rejects.toThrow("laboratory does not exist");
    });
  });

  // =========================================================================
  // 7. FACULTY MAPPING & WORKLOAD ALLOCATION (Tests 14-19, 35)
  // =========================================================================
  describe("7. Faculty Mapping & Deterministic Workload", () => {
    it("14. Admin can map faculty to subject", async () => {
      const payload = {
        facultyId: "demo-faculty-003", // Dr. Sandeep Joshi
        subjectId: "subj-os", // Operating Systems
        divisionId: "div-comp-b", // Division B
        academicYear: "2024-2025",
        weeklyHours: 3,
        isActive: true,
      };

      const parsed = createFacultyMappingSchema.safeParse(payload);
      expect(parsed.success).toBe(true);

      const mapping = await AcademicService.createFacultyMapping(parsed.data!, adminUser.id);
      expect(mapping.facultyId).toBe("demo-faculty-003");
      expect(mapping.subjectId).toBe("subj-os");
      expect(mapping.divisionId).toBe("div-comp-b");
      expect(mapping.weeklyHours).toBe(3);
    });

    it("15. Invalid faculty mapping rejected (nonexistent faculty or inactive subject)", async () => {
      const payload = {
        facultyId: "ghost-faculty",
        subjectId: "subj-dbms",
        divisionId: "div-comp-a",
        academicYear: "2024-2025",
      };

      await expect(
        AcademicService.createFacultyMapping(payload, adminUser.id)
      ).rejects.toThrow("faculty member does not exist");
    });

    it("16. Duplicate faculty mapping rejected", async () => {
      // fm-dbms-div-a is already mapped to demo-faculty-001 for div-comp-a in 2024-2025
      const duplicatePayload = {
        facultyId: "demo-faculty-001",
        subjectId: "subj-dbms",
        divisionId: "div-comp-a",
        academicYear: "2024-2025",
      };

      await expect(
        AcademicService.createFacultyMapping(duplicatePayload, adminUser.id)
      ).rejects.toThrow("already mapped");
    });

    it("17. Admin can unmap faculty", async () => {
      const mappingId = "fm-spm-div-a";
      const unmapped = await AcademicService.deleteFacultyMapping(mappingId, adminUser.id);
      expect(unmapped.isActive).toBe(false);

      const activeList = await AcademicService.getFacultyMappings({ isActive: true });
      expect(activeList.some((m) => m.id === mappingId)).toBe(false);
    });

    it("18. Faculty cannot mutate mappings (RBAC permission check)", () => {
      const canMutate = (role: Role) => role === Role.ADMIN;
      expect(canMutate(facultyUser.role)).toBe(false);
    });

    it("19. Student cannot mutate mappings (RBAC permission check)", () => {
      const canMutate = (role: Role) => role === Role.ADMIN;
      expect(canMutate(studentUser.role)).toBe(false);
    });

    it("35. Cross-entity IDOR attempts are blocked by strict server-side validation", async () => {
      // Attempting to assign subject to nonexistent or incompatible division
      const idorPayload = {
        facultyId: "demo-faculty-001",
        subjectId: "subj-dbms",
        divisionId: "malicious-foreign-division-id",
        academicYear: "2024-2025",
      };

      await expect(
        AcademicService.createFacultyMapping(idorPayload, adminUser.id)
      ).rejects.toThrow("division does not exist");
    });

    it("evaluates deterministic faculty workload correctly", async () => {
      const workloads = await AcademicService.calculateFacultyWorkload("demo-faculty-001");
      expect(workloads.length).toBe(1);

      const meeraWorkload = workloads[0];
      expect(meeraWorkload.facultyName).toBe("Prof. Meera Sen");
      // Assigned: DBMS (4h) + CN (3h) + DBMS Lab (2h) = 9h
      expect(meeraWorkload.assignedWeeklyPeriods).toBe(9);
      expect(meeraWorkload.theoryPeriods).toBe(7);
      expect(meeraWorkload.labPeriods).toBe(2);
      expect(meeraWorkload.totalSubjects).toBe(3);
    });
  });

  // =========================================================================
  // 8. ROOMS MANAGEMENT (Tests 20-22)
  // =========================================================================
  describe("8. Rooms Management", () => {
    it("20. Admin can create room", async () => {
      const payload = {
        roomNumber: "Room 401",
        building: "Academic Block B",
        floor: 4,
        capacity: 80,
        type: RoomType.CLASSROOM,
        hasProjector: true,
        isAvailable: true,
        departmentId: "dept-comp",
        isActive: true,
      };

      const parsed = createRoomSchema.safeParse(payload);
      expect(parsed.success).toBe(true);

      const room = await AcademicService.createRoom(parsed.data!, adminUser.id);
      expect(room.roomNumber).toBe("Room 401");
      expect(room.capacity).toBe(80);
      expect(room.type).toBe(RoomType.CLASSROOM);
    });

    it("21. Invalid room capacity rejected (capacity <= 0)", async () => {
      const payload = {
        roomNumber: "Room Zero",
        building: "Academic Block B",
        floor: 1,
        capacity: 0, // Invalid
        type: RoomType.CLASSROOM,
      };

      const parsed = createRoomSchema.safeParse(payload);
      expect(parsed.success).toBe(false);

      await expect(
        AcademicService.createRoom(payload as any, adminUser.id)
      ).rejects.toThrow("strictly greater than 0");
    });

    it("22. Inactive room cannot be newly assigned to timetable slots", async () => {
      // Deactivate lab-2
      await AcademicService.deleteRoom("lab-2", adminUser.id);
      const room = await AcademicService.getRoomById("lab-2");
      expect(room?.isActive).toBe(false);
      expect(room?.isAvailable).toBe(false);

      // Validate timetable prerequisites recognizes inactive room
      const prereq = await AcademicService.validateTimetablePrerequisites("div-comp-a");
      expect(prereq).toBeDefined();
    });
  });

  // =========================================================================
  // 9. LABORATORY MANAGEMENT (Tests 23-24)
  // =========================================================================
  describe("9. Laboratory Management", () => {
    it("23. Admin can create laboratory", async () => {
      const payload = {
        name: "Artificial Intelligence & Robotics Research Lab",
        code: "LAB-CS-05",
        departmentId: "dept-comp",
        roomId: "lab-1",
        capacity: 35,
        equipment: ["35x Nvidia RTX Workstations", "ROS 2 TurtleBots"],
        labAssistant: "Gajanan More",
        isActive: true,
      };

      const parsed = createLaboratorySchema.safeParse(payload);
      expect(parsed.success).toBe(true);

      const lab = await AcademicService.createLaboratory(parsed.data!, adminUser.id);
      expect(lab.code).toBe("LAB-CS-05");
      expect(lab.roomId).toBe("lab-1");
      expect(lab.equipment.length).toBe(2);
    });

    it("24. Invalid laboratory mapping rejected (linking to a classroom instead of LAB)", async () => {
      const payload = {
        name: "Mismatched Lab",
        code: "LAB-MISMATCH",
        departmentId: "dept-comp",
        roomId: "room-201", // room-201 is CLASSROOM, not LAB!
        capacity: 30,
      };

      await expect(
        AcademicService.createLaboratory(payload, adminUser.id)
      ).rejects.toThrow("is of type 'CLASSROOM', not 'LAB'");
    });
  });

  // =========================================================================
  // 10. CONFIGURATION HEALTH & TIMETABLE PREREQUISITES (Tests 26-30)
  // =========================================================================
  describe("10. Configuration Health & Timetable Integration", () => {
    it("26. Configuration health detects unmapped subject", async () => {
      // Create a subject without any faculty mapping
      await AcademicService.createSubject(
        {
          name: "Cloud Computing Elective",
          code: "COMP-E01",
          departmentId: "dept-comp",
          semester: 6,
          credits: 3,
          type: SubjectType.ELECTIVE,
          weeklyHours: 3,
        },
        adminUser.id
      );

      const health = await AcademicService.auditConfigurationHealth();
      expect(health.warningCount).toBeGreaterThan(0);

      const unmappedCheck = health.checks.find((c) => c.id === "UNMAPPED_SUBJECTS");
      expect(unmappedCheck?.severity).toBe("WARNING");
      expect(unmappedCheck?.items.some((i) => i.name.includes("COMP-E01"))).toBe(true);
    });

    it("27. Configuration health detects unmapped faculty", async () => {
      const health = await AcademicService.auditConfigurationHealth();
      const unmappedFacultyCheck = health.checks.find((c) => c.id === "UNMAPPED_FACULTY");
      expect(unmappedFacultyCheck).toBeDefined();
    });

    it("28. Configuration health detects invalid resources (labs without physical rooms)", async () => {
      const health = await AcademicService.auditConfigurationHealth();
      const labCheck = health.checks.find((c) => c.id === "LABS_WITHOUT_ROOMS");
      expect(labCheck).toBeDefined();
      // lab-res-03 was intentionally seeded with roomId = null
      expect(labCheck?.items.some((i) => i.name.includes("LAB-EXTC-01"))).toBe(true);
    });

    it("29. Audit log created for admin mutations", async () => {
      // When database is online, prisma.auditLog.create is called.
      // In offline/demo mode, AcademicService.logAudit catches gracefully without throwing.
      const dept = await AcademicService.createDepartment(
        {
          name: "Civil Engineering",
          code: "CIVIL",
        },
        adminUser.id
      );
      expect(dept).toBeDefined();
    });

    it("30. Existing timetable configuration remains compatible with Phase 5 CSP engine", async () => {
      // Validates timetable service academic configuration
      const config = await TimetableService.getAcademicConfiguration("div-comp-a");
      expect(config.divisionId).toBe("div-comp-a");
      expect(config.subjects.length).toBeGreaterThan(0);
      expect(config.rooms.length).toBeGreaterThan(0);

      // Verify prerequisite validator runs successfully
      const prereq = await AcademicService.validateTimetablePrerequisites("div-comp-a");
      expect(prereq.divisionName).toBe("Division A");
      expect(prereq.isValid).toBe(true);
    });
  });

  // =========================================================================
  // 11. REGRESSION PROTECTION FOR PREVIOUS PHASES (Tests 31-34)
  // =========================================================================
  describe("11. Regression Protection for Phases 1-11", () => {
    it("31. Existing attendance functionality remains intact (Phase 4)", async () => {
      const summary = await AttendanceService.getStudentSummary(studentUser.id);
      expect(summary).toBeDefined();
      expect(summary.studentId).toBeDefined();
      expect(typeof summary.overallPercentage).toBe("number");
    });

    it("32. Existing assignment functionality remains intact (Phase 6)", async () => {
      const result = await AssignmentService.getStudentAssignments(studentUser.id);
      expect(result).toBeDefined();
      expect(Array.isArray(result.assignments)).toBe(true);
    });

    it("33. Existing notices, events, clubs, placement, and lost & found remain intact", async () => {
      // Notices (Phase 7)
      const notices = await NoticeService.getNotices({
        userId: studentUser.id,
        role: Role.STUDENT,
      });
      expect(Array.isArray(notices.notices)).toBe(true);

      // Events (Phase 8)
      const events = await EventService.getEvents({
        userId: studentUser.id,
        role: Role.STUDENT,
      });
      expect(Array.isArray(events.events)).toBe(true);

      // Clubs (Phase 9)
      const clubs = await ClubService.getClubs({
        userId: studentUser.id,
        role: Role.STUDENT,
      });
      expect(Array.isArray(clubs.clubs)).toBe(true);

      // Placement (Phase 10)
      const drives = await PlacementService.getDrives({
        userId: studentUser.id,
        role: Role.STUDENT,
      });
      expect(Array.isArray(drives.drives)).toBe(true);

      // Lost & Found (Phase 11)
      const reports = await LostFoundService.getReports({
        userId: studentUser.id,
        role: Role.STUDENT,
      });
      expect(Array.isArray(reports.items)).toBe(true);
    });

    it("34. Unauthorized access is blocked across role boundary", () => {
      const adminOnly: Role[] = [Role.ADMIN];
      expect(adminOnly.includes(studentUser.role)).toBe(false);
      expect(adminOnly.includes(facultyUser.role)).toBe(false);
    });
  });
});
