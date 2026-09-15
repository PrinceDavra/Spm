import { prisma } from "@/lib/prisma";
import { isDatabaseOnline } from "@/lib/db-health";
import { SubjectType, RoomType, Role } from "@prisma/client";
import {
  DEMO_DEPARTMENTS,
  DEMO_PROGRAMS,
  DEMO_BATCHES,
  DEMO_SEMESTERS,
  DEMO_CLASSES,
  DEMO_DIVISIONS,
  DEMO_ROOMS,
  DEMO_LABORATORIES,
  DEMO_SUBJECTS,
  DEMO_FACULTY_MAPPINGS,
  DemoDepartment,
  DemoProgram,
  DemoBatch,
  DemoAcademicSemester,
  DemoClass,
  DemoDivision,
  DemoRoom,
  DemoLaboratory,
  DemoSubject,
  DemoFacultyMapping,
} from "@/lib/admin/demo-academic";
import { DEMO_USERS } from "@/lib/auth/demo-users";
import {
  CreateDepartmentInput,
  UpdateDepartmentInput,
  CreateProgramInput,
  UpdateProgramInput,
  CreateBatchInput,
  UpdateBatchInput,
  CreateSemesterInput,
  UpdateSemesterInput,
  CreateClassInput,
  UpdateClassInput,
  CreateDivisionInput,
  UpdateDivisionInput,
  CreateSubjectInput,
  UpdateSubjectInput,
  CreateFacultyMappingInput,
  UpdateFacultyMappingInput,
  CreateRoomInput,
  UpdateRoomInput,
  CreateLaboratoryInput,
  UpdateLaboratoryInput,
} from "@/validators/academic.schema";

export interface FacultyWorkloadItem {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  type: SubjectType;
  divisionId: string;
  divisionName: string;
  weeklyHours: number;
}

export interface FacultyWorkloadSummary {
  facultyId: string;
  facultyName: string;
  employeeId: string;
  departmentName: string;
  totalSubjects: number;
  totalDivisions: number;
  assignedWeeklyPeriods: number;
  theoryPeriods: number;
  labPeriods: number;
  scheduledWeeklyPeriods: number;
  maxWeeklyCapacity: number;
  allocations: FacultyWorkloadItem[];
}

export interface ConfigurationHealthIssue {
  id: string;
  title: string;
  severity: "PASS" | "WARNING" | "ERROR";
  count: number;
  description: string;
  remediationHint: string;
  items: Array<{ id: string; name: string; details?: string }>;
}

export interface ConfigurationHealthReport {
  timestamp: string;
  status: "HEALTHY" | "WARNING" | "CRITICAL";
  metrics: {
    departmentsCount: number;
    programsCount: number;
    batchesCount: number;
    divisionsCount: number;
    subjectsCount: number;
    facultyCount: number;
    mappingsCount: number;
    roomsCount: number;
    laboratoriesCount: number;
  };
  totalIssues: number;
  errorCount: number;
  warningCount: number;
  checks: ConfigurationHealthIssue[];
}

export class AcademicService {
  /**
   * Safe audit log recorder for academic mutations
   */
  private static async logAudit(
    adminUserId: string,
    action: string,
    entity: string,
    entityId: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    try {
      if (await isDatabaseOnline()) {
        await prisma.auditLog.create({
          data: {
            userId: adminUserId,
            action,
            entity,
            entityId,
            details: details ? JSON.stringify(details) : undefined,
          },
        });
      }
    } catch {
      // Non-blocking fallback for offline/demo mode
    }
  }

  // =========================================================================
  // 1. DEPARTMENT MANAGEMENT
  // =========================================================================

  static async getDepartments(filters?: { search?: string; isActive?: boolean }) {
    let list = [...DEMO_DEPARTMENTS];

    if (filters?.isActive !== undefined) {
      list = list.filter((d) => d.isActive === filters.isActive);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.code.toLowerCase().includes(q) ||
          (d.headOfDepartment && d.headOfDepartment.toLowerCase().includes(q))
      );
    }

    // Attach computed counts
    return list.map((dept) => {
      const programsCount = DEMO_PROGRAMS.filter((p) => p.departmentId === dept.id && p.isActive).length;
      const subjectsCount = DEMO_SUBJECTS.filter((s) => s.departmentId === dept.id && s.isActive).length;
      const labsCount = DEMO_LABORATORIES.filter((l) => l.departmentId === dept.id && l.isActive).length;
      const facultyCount = DEMO_USERS.filter(
        (u) => u.role === Role.FACULTY && u.departmentName?.toLowerCase().includes(dept.code.toLowerCase())
      ).length;

      return {
        ...dept,
        programsCount,
        subjectsCount,
        labsCount,
        facultyCount,
      };
    });
  }

  static async getDepartmentById(id: string) {
    const dept = DEMO_DEPARTMENTS.find((d) => d.id === id);
    if (!dept) return null;

    const programs = DEMO_PROGRAMS.filter((p) => p.departmentId === dept.id);
    const subjects = DEMO_SUBJECTS.filter((s) => s.departmentId === dept.id);
    const labs = DEMO_LABORATORIES.filter((l) => l.departmentId === dept.id);
    const rooms = DEMO_ROOMS.filter((r) => r.departmentId === dept.id);

    return {
      ...dept,
      programs,
      subjects,
      laboratories: labs,
      rooms,
    };
  }

  static async createDepartment(input: CreateDepartmentInput, adminUserId: string) {
    // 1. Uniqueness check
    const existingCode = DEMO_DEPARTMENTS.find(
      (d) => d.code.toUpperCase() === input.code.toUpperCase()
    );
    if (existingCode) {
      throw new Error(`Department with code '${input.code}' already exists`);
    }

    const existingName = DEMO_DEPARTMENTS.find(
      (d) => d.name.toLowerCase() === input.name.toLowerCase()
    );
    if (existingName) {
      throw new Error(`Department with name '${input.name}' already exists`);
    }

    const newDept: DemoDepartment = {
      id: `dept-${Date.now()}`,
      name: input.name.trim(),
      code: input.code.trim().toUpperCase(),
      description: input.description ?? null,
      headOfDepartment: input.headOfDepartment ?? null,
      isActive: input.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    DEMO_DEPARTMENTS.unshift(newDept);

    await this.logAudit(adminUserId, "DEPARTMENT_CREATED", "Department", newDept.id, {
      code: newDept.code,
      name: newDept.name,
    });

    return newDept;
  }

  static async updateDepartment(id: string, input: UpdateDepartmentInput, adminUserId: string) {
    const index = DEMO_DEPARTMENTS.findIndex((d) => d.id === id);
    if (index === -1) {
      throw new Error("Department not found");
    }

    const existing = DEMO_DEPARTMENTS[index];

    if (input.code && input.code.toUpperCase() !== existing.code.toUpperCase()) {
      const duplicateCode = DEMO_DEPARTMENTS.find(
        (d) => d.id !== id && d.code.toUpperCase() === input.code!.toUpperCase()
      );
      if (duplicateCode) {
        throw new Error(`Department with code '${input.code}' already exists`);
      }
    }

    if (input.name && input.name.toLowerCase() !== existing.name.toLowerCase()) {
      const duplicateName = DEMO_DEPARTMENTS.find(
        (d) => d.id !== id && d.name.toLowerCase() === input.name!.toLowerCase()
      );
      if (duplicateName) {
        throw new Error(`Department with name '${input.name}' already exists`);
      }
    }

    const updated: DemoDepartment = {
      ...existing,
      ...input,
      code: input.code ? input.code.toUpperCase() : existing.code,
      updatedAt: new Date().toISOString(),
    };

    DEMO_DEPARTMENTS[index] = updated;

    await this.logAudit(adminUserId, "DEPARTMENT_UPDATED", "Department", updated.id, {
      changes: input,
    });

    return updated;
  }

  static async deleteDepartment(id: string, adminUserId: string) {
    const index = DEMO_DEPARTMENTS.findIndex((d) => d.id === id);
    if (index === -1) {
      throw new Error("Department not found");
    }

    // Soft archive
    DEMO_DEPARTMENTS[index].isActive = false;
    DEMO_DEPARTMENTS[index].updatedAt = new Date().toISOString();

    await this.logAudit(adminUserId, "DEPARTMENT_DEACTIVATED", "Department", id);
    return DEMO_DEPARTMENTS[index];
  }

  // =========================================================================
  // 2. PROGRAM / COURSE MANAGEMENT
  // =========================================================================

  static async getPrograms(filters?: { departmentId?: string; isActive?: boolean; search?: string }) {
    let list = [...DEMO_PROGRAMS];

    if (filters?.departmentId) {
      list = list.filter((p) => p.departmentId === filters.departmentId);
    }
    if (filters?.isActive !== undefined) {
      list = list.filter((p) => p.isActive === filters.isActive);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.degree.toLowerCase().includes(q)
      );
    }

    return list.map((prog) => {
      const department = DEMO_DEPARTMENTS.find((d) => d.id === prog.departmentId);
      const activeBatchesCount = DEMO_BATCHES.filter((b) => b.programId === prog.id && b.isActive).length;
      return {
        ...prog,
        departmentName: department?.name ?? "Unknown Department",
        departmentCode: department?.code ?? "N/A",
        activeBatchesCount,
      };
    });
  }

  static async getProgramById(id: string) {
    const prog = DEMO_PROGRAMS.find((p) => p.id === id);
    if (!prog) return null;

    const department = DEMO_DEPARTMENTS.find((d) => d.id === prog.departmentId);
    const batches = DEMO_BATCHES.filter((b) => b.programId === prog.id);
    const subjects = DEMO_SUBJECTS.filter((s) => s.programId === prog.id);

    return {
      ...prog,
      department,
      batches,
      subjects,
    };
  }

  static async createProgram(input: CreateProgramInput, adminUserId: string) {
    // 1. Department must exist and be active
    const dept = DEMO_DEPARTMENTS.find((d) => d.id === input.departmentId);
    if (!dept) {
      throw new Error("Specified department does not exist");
    }
    if (!dept.isActive) {
      throw new Error("Cannot associate program with an inactive department");
    }

    // 2. Code uniqueness
    const existing = DEMO_PROGRAMS.find((p) => p.code.toUpperCase() === input.code.toUpperCase());
    if (existing) {
      throw new Error(`Program with code '${input.code}' already exists`);
    }

    const newProg: DemoProgram = {
      id: `prog-${Date.now()}`,
      name: input.name.trim(),
      code: input.code.trim().toUpperCase(),
      degree: input.degree.trim(),
      departmentId: input.departmentId,
      durationYears: input.durationYears ?? 4,
      totalSemesters: input.totalSemesters ?? 8,
      isActive: input.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    DEMO_PROGRAMS.unshift(newProg);

    await this.logAudit(adminUserId, "PROGRAM_CREATED", "Program", newProg.id, {
      code: newProg.code,
      name: newProg.name,
      departmentId: newProg.departmentId,
    });

    return newProg;
  }

  static async updateProgram(id: string, input: UpdateProgramInput, adminUserId: string) {
    const index = DEMO_PROGRAMS.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error("Program not found");
    }

    const existing = DEMO_PROGRAMS[index];

    if (input.code && input.code.toUpperCase() !== existing.code.toUpperCase()) {
      const duplicate = DEMO_PROGRAMS.find(
        (p) => p.id !== id && p.code.toUpperCase() === input.code!.toUpperCase()
      );
      if (duplicate) {
        throw new Error(`Program with code '${input.code}' already exists`);
      }
    }

    if (input.departmentId && input.departmentId !== existing.departmentId) {
      const dept = DEMO_DEPARTMENTS.find((d) => d.id === input.departmentId);
      if (!dept || !dept.isActive) {
        throw new Error("Specified department does not exist or is inactive");
      }
    }

    const updated: DemoProgram = {
      ...existing,
      ...input,
      code: input.code ? input.code.toUpperCase() : existing.code,
      updatedAt: new Date().toISOString(),
    };

    DEMO_PROGRAMS[index] = updated;

    await this.logAudit(adminUserId, "PROGRAM_UPDATED", "Program", updated.id, {
      changes: input,
    });

    return updated;
  }

  static async deleteProgram(id: string, adminUserId: string) {
    const index = DEMO_PROGRAMS.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error("Program not found");
    }

    DEMO_PROGRAMS[index].isActive = false;
    DEMO_PROGRAMS[index].updatedAt = new Date().toISOString();

    await this.logAudit(adminUserId, "PROGRAM_DEACTIVATED", "Program", id);
    return DEMO_PROGRAMS[index];
  }

  // =========================================================================
  // 3. BATCH MANAGEMENT
  // =========================================================================

  static async getBatches(filters?: { programId?: string; isActive?: boolean; search?: string }) {
    let list = [...DEMO_BATCHES];

    if (filters?.programId) {
      list = list.filter((b) => b.programId === filters.programId);
    }
    if (filters?.isActive !== undefined) {
      list = list.filter((b) => b.isActive === filters.isActive);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter((b) => b.name.toLowerCase().includes(q));
    }

    return list.map((batch) => {
      const program = DEMO_PROGRAMS.find((p) => p.id === batch.programId);
      const department = program ? DEMO_DEPARTMENTS.find((d) => d.id === program.departmentId) : null;
      return {
        ...batch,
        programName: program?.name ?? "Unknown Program",
        programCode: program?.code ?? "N/A",
        departmentName: department?.name ?? "N/A",
      };
    });
  }

  static async getBatchById(id: string) {
    const batch = DEMO_BATCHES.find((b) => b.id === id);
    if (!batch) return null;

    const program = DEMO_PROGRAMS.find((p) => p.id === batch.programId);
    const classes = DEMO_CLASSES.filter((c) => c.batchId === batch.id);

    return {
      ...batch,
      program,
      classes,
    };
  }

  static async createBatch(input: CreateBatchInput, adminUserId: string) {
    // 1. Program must exist and be active
    const prog = DEMO_PROGRAMS.find((p) => p.id === input.programId);
    if (!prog) {
      throw new Error("Specified program does not exist");
    }
    if (!prog.isActive) {
      throw new Error("Cannot associate batch with an inactive program");
    }

    // 2. Validate startYear < endYear
    if (input.endYear <= input.startYear) {
      throw new Error("Batch end year must be strictly greater than start year");
    }

    // 3. Prevent duplicate batch for same program
    const existing = DEMO_BATCHES.find(
      (b) => b.programId === input.programId && b.name.toLowerCase() === input.name.toLowerCase()
    );
    if (existing) {
      throw new Error(`Batch '${input.name}' already exists for this program`);
    }

    const newBatch: DemoBatch = {
      id: `batch-${Date.now()}`,
      name: input.name.trim(),
      startYear: input.startYear,
      endYear: input.endYear,
      programId: input.programId,
      currentSemester: input.currentSemester ?? 1,
      isActive: input.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    DEMO_BATCHES.unshift(newBatch);

    await this.logAudit(adminUserId, "BATCH_CREATED", "Batch", newBatch.id, {
      name: newBatch.name,
      programId: newBatch.programId,
      years: `${newBatch.startYear}-${newBatch.endYear}`,
    });

    return newBatch;
  }

  static async updateBatch(id: string, input: UpdateBatchInput, adminUserId: string) {
    const index = DEMO_BATCHES.findIndex((b) => b.id === id);
    if (index === -1) {
      throw new Error("Batch not found");
    }

    const existing = DEMO_BATCHES[index];
    const newStart = input.startYear ?? existing.startYear;
    const newEnd = input.endYear ?? existing.endYear;

    if (newEnd <= newStart) {
      throw new Error("Batch end year must be strictly greater than start year");
    }

    const updated: DemoBatch = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    DEMO_BATCHES[index] = updated;

    await this.logAudit(adminUserId, "BATCH_UPDATED", "Batch", updated.id, {
      changes: input,
    });

    return updated;
  }

  static async deleteBatch(id: string, adminUserId: string) {
    const index = DEMO_BATCHES.findIndex((b) => b.id === id);
    if (index === -1) {
      throw new Error("Batch not found");
    }

    DEMO_BATCHES[index].isActive = false;
    DEMO_BATCHES[index].updatedAt = new Date().toISOString();

    await this.logAudit(adminUserId, "BATCH_DEACTIVATED", "Batch", id);
    return DEMO_BATCHES[index];
  }

  // =========================================================================
  // 4. SEMESTER MANAGEMENT
  // =========================================================================

  static async getSemesters(filters?: { academicYear?: string; isActive?: boolean }) {
    let list = [...DEMO_SEMESTERS];

    if (filters?.academicYear) {
      list = list.filter((s) => s.academicYear === filters.academicYear);
    }
    if (filters?.isActive !== undefined) {
      list = list.filter((s) => s.isActive === filters.isActive);
    }

    return list.sort((a, b) => a.semesterNumber - b.semesterNumber);
  }

  static async getSemesterById(id: string) {
    return DEMO_SEMESTERS.find((s) => s.id === id) ?? null;
  }

  static async createSemester(input: CreateSemesterInput, adminUserId: string) {
    const duplicate = DEMO_SEMESTERS.find(
      (s) =>
        s.semesterNumber === input.semesterNumber &&
        s.academicYear === input.academicYear &&
        s.term === input.term
    );
    if (duplicate) {
      throw new Error(
        `Semester ${input.semesterNumber} for academic year ${input.academicYear} (${input.term}) already exists`
      );
    }

    const newSem: DemoAcademicSemester = {
      id: `sem-${Date.now()}`,
      semesterNumber: input.semesterNumber,
      academicYear: input.academicYear,
      term: input.term ?? "EVEN",
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
      isActive: input.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    DEMO_SEMESTERS.push(newSem);

    await this.logAudit(adminUserId, "SEMESTER_CREATED", "AcademicSemester", newSem.id, {
      semesterNumber: newSem.semesterNumber,
      academicYear: newSem.academicYear,
      term: newSem.term,
    });

    return newSem;
  }

  static async updateSemester(id: string, input: UpdateSemesterInput, adminUserId: string) {
    const index = DEMO_SEMESTERS.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error("Semester not found");
    }

    const updated: DemoAcademicSemester = {
      ...DEMO_SEMESTERS[index],
      ...input,
      updatedAt: new Date().toISOString(),
    };

    DEMO_SEMESTERS[index] = updated;

    await this.logAudit(adminUserId, "SEMESTER_UPDATED", "AcademicSemester", updated.id, {
      changes: input,
    });

    return updated;
  }

  // =========================================================================
  // 5. CLASSES & DIVISIONS MANAGEMENT
  // =========================================================================

  static async getClasses(filters?: { departmentId?: string; semester?: number; academicYear?: string }) {
    let list = [...DEMO_CLASSES];

    if (filters?.departmentId) {
      list = list.filter((c) => c.departmentId === filters.departmentId);
    }
    if (filters?.semester) {
      list = list.filter((c) => c.semester === filters.semester);
    }
    if (filters?.academicYear) {
      list = list.filter((c) => c.academicYear === filters.academicYear);
    }

    return list.map((cls) => {
      const dept = DEMO_DEPARTMENTS.find((d) => d.id === cls.departmentId);
      const divisions = DEMO_DIVISIONS.filter((d) => d.classId === cls.id);
      return {
        ...cls,
        departmentName: dept?.name ?? "Unknown Department",
        departmentCode: dept?.code ?? "N/A",
        divisions,
      };
    });
  }

  static async createClass(input: CreateClassInput, adminUserId: string) {
    const dept = DEMO_DEPARTMENTS.find((d) => d.id === input.departmentId);
    if (!dept || !dept.isActive) {
      throw new Error("Specified department does not exist or is inactive");
    }

    const duplicate = DEMO_CLASSES.find(
      (c) =>
        c.departmentId === input.departmentId &&
        c.semester === input.semester &&
        c.academicYear === input.academicYear
    );
    if (duplicate) {
      throw new Error(
        `Class for department ${dept.code}, semester ${input.semester} (${input.academicYear}) already exists`
      );
    }

    const newClass: DemoClass = {
      id: `class-${Date.now()}`,
      departmentId: input.departmentId,
      semester: input.semester,
      name: input.name.trim(),
      academicYear: input.academicYear,
      programId: input.programId ?? null,
      batchId: input.batchId ?? null,
      isActive: input.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    DEMO_CLASSES.push(newClass);

    await this.logAudit(adminUserId, "CLASS_CREATED", "Class", newClass.id, {
      name: newClass.name,
      departmentId: newClass.departmentId,
      semester: newClass.semester,
    });

    return newClass;
  }

  static async getDivisions(filters?: { classId?: string; isActive?: boolean }) {
    let list = [...DEMO_DIVISIONS];

    if (filters?.classId) {
      list = list.filter((d) => d.classId === filters.classId);
    }
    if (filters?.isActive !== undefined) {
      list = list.filter((d) => d.isActive === filters.isActive);
    }

    return list.map((div) => {
      const cls = DEMO_CLASSES.find((c) => c.id === div.classId);
      const dept = cls ? DEMO_DEPARTMENTS.find((d) => d.id === cls.departmentId) : null;
      return {
        ...div,
        className: cls?.name ?? "Unknown Class",
        semester: cls?.semester,
        academicYear: cls?.academicYear,
        departmentName: dept?.name,
        departmentCode: dept?.code,
      };
    });
  }

  static async createDivision(input: CreateDivisionInput, adminUserId: string) {
    const parentClass = DEMO_CLASSES.find((c) => c.id === input.classId);
    if (!parentClass || !parentClass.isActive) {
      throw new Error("Specified parent class does not exist or is inactive");
    }

    const duplicate = DEMO_DIVISIONS.find(
      (d) => d.classId === input.classId && d.name.toLowerCase() === input.name.toLowerCase()
    );
    if (duplicate) {
      throw new Error(`Division '${input.name}' already exists in class '${parentClass.name}'`);
    }

    if (input.capacity !== undefined && input.capacity <= 0) {
      throw new Error("Division student capacity must be greater than 0");
    }

    const newDiv: DemoDivision = {
      id: `div-${Date.now()}`,
      classId: input.classId,
      name: input.name.trim(),
      code: input.code?.trim() ?? null,
      capacity: input.capacity ?? 60,
      isActive: input.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    DEMO_DIVISIONS.push(newDiv);

    await this.logAudit(adminUserId, "DIVISION_CREATED", "Division", newDiv.id, {
      name: newDiv.name,
      classId: newDiv.classId,
      capacity: newDiv.capacity,
    });

    return newDiv;
  }

  static async updateDivision(id: string, input: UpdateDivisionInput, adminUserId: string) {
    const index = DEMO_DIVISIONS.findIndex((d) => d.id === id);
    if (index === -1) {
      throw new Error("Division not found");
    }

    if (input.capacity !== undefined && input.capacity <= 0) {
      throw new Error("Division capacity must be greater than 0");
    }

    const updated: DemoDivision = {
      ...DEMO_DIVISIONS[index],
      ...input,
      updatedAt: new Date().toISOString(),
    };

    DEMO_DIVISIONS[index] = updated;

    await this.logAudit(adminUserId, "DIVISION_UPDATED", "Division", updated.id, {
      changes: input,
    });

    return updated;
  }

  // =========================================================================
  // 6. SUBJECT MANAGEMENT
  // =========================================================================

  static async getSubjects(filters?: {
    departmentId?: string;
    semester?: number;
    type?: SubjectType;
    isActive?: boolean;
    search?: string;
  }) {
    let list = [...DEMO_SUBJECTS];

    if (filters?.departmentId) {
      list = list.filter((s) => s.departmentId === filters.departmentId);
    }
    if (filters?.semester) {
      list = list.filter((s) => s.semester === filters.semester);
    }
    if (filters?.type) {
      list = list.filter((s) => s.type === filters.type);
    }
    if (filters?.isActive !== undefined) {
      list = list.filter((s) => s.isActive === filters.isActive);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
      );
    }

    return list.map((subj) => {
      const dept = DEMO_DEPARTMENTS.find((d) => d.id === subj.departmentId);
      const program = subj.programId ? DEMO_PROGRAMS.find((p) => p.id === subj.programId) : null;
      const lab = subj.laboratoryId ? DEMO_LABORATORIES.find((l) => l.id === subj.laboratoryId) : null;
      const assignedFacultyMappings = DEMO_FACULTY_MAPPINGS.filter(
        (m) => m.subjectId === subj.id && m.isActive
      );

      return {
        ...subj,
        departmentName: dept?.name ?? "Unknown Department",
        departmentCode: dept?.code ?? "N/A",
        programName: program?.name ?? null,
        laboratoryName: lab?.name ?? null,
        mappedFacultyCount: assignedFacultyMappings.length,
      };
    });
  }

  static async getSubjectById(id: string) {
    const subj = DEMO_SUBJECTS.find((s) => s.id === id);
    if (!subj) return null;

    const department = DEMO_DEPARTMENTS.find((d) => d.id === subj.departmentId);
    const laboratory = subj.laboratoryId ? DEMO_LABORATORIES.find((l) => l.id === subj.laboratoryId) : null;
    const mappings = DEMO_FACULTY_MAPPINGS.filter((m) => m.subjectId === subj.id);

    return {
      ...subj,
      department,
      laboratory,
      mappings,
    };
  }

  static async createSubject(input: CreateSubjectInput, adminUserId: string) {
    // 1. Department must exist and be active
    const dept = DEMO_DEPARTMENTS.find((d) => d.id === input.departmentId);
    if (!dept) {
      throw new Error("Specified department does not exist");
    }
    if (!dept.isActive) {
      throw new Error("Cannot assign subject to an inactive department");
    }

    // 2. Unique code
    const existing = DEMO_SUBJECTS.find(
      (s) => s.code.toUpperCase() === input.code.toUpperCase()
    );
    if (existing) {
      throw new Error(`Subject with code '${input.code}' already exists`);
    }

    // 3. If lab subject, check laboratory compatibility
    if (input.type === SubjectType.LAB || input.requiresLab) {
      if (input.laboratoryId) {
        const lab = DEMO_LABORATORIES.find((l) => l.id === input.laboratoryId);
        if (!lab || !lab.isActive) {
          throw new Error("Specified laboratory does not exist or is inactive");
        }
      }
    }

    const newSubject: DemoSubject = {
      id: `subj-${Date.now()}`,
      name: input.name.trim(),
      code: input.code.trim().toUpperCase(),
      departmentId: input.departmentId,
      semester: input.semester,
      credits: input.credits ?? 3,
      type: input.type ?? SubjectType.THEORY,
      weeklyHours: input.weeklyHours ?? 3,
      description: input.description ?? null,
      syllabusUrl: input.syllabusUrl ?? null,
      programId: input.programId ?? null,
      laboratoryId: input.laboratoryId ?? null,
      requiresLab: input.type === SubjectType.LAB || (input.requiresLab ?? false),
      isActive: input.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    DEMO_SUBJECTS.unshift(newSubject);

    await this.logAudit(adminUserId, "SUBJECT_CREATED", "Subject", newSubject.id, {
      code: newSubject.code,
      name: newSubject.name,
      type: newSubject.type,
      weeklyHours: newSubject.weeklyHours,
    });

    return newSubject;
  }

  static async updateSubject(id: string, input: UpdateSubjectInput, adminUserId: string) {
    const index = DEMO_SUBJECTS.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error("Subject not found");
    }

    const existing = DEMO_SUBJECTS[index];

    if (input.code && input.code.toUpperCase() !== existing.code.toUpperCase()) {
      const duplicate = DEMO_SUBJECTS.find(
        (s) => s.id !== id && s.code.toUpperCase() === input.code!.toUpperCase()
      );
      if (duplicate) {
        throw new Error(`Subject with code '${input.code}' already exists`);
      }
    }

    if (input.departmentId && input.departmentId !== existing.departmentId) {
      const dept = DEMO_DEPARTMENTS.find((d) => d.id === input.departmentId);
      if (!dept || !dept.isActive) {
        throw new Error("Specified department does not exist or is inactive");
      }
    }

    const updated: DemoSubject = {
      ...existing,
      ...input,
      code: input.code ? input.code.toUpperCase() : existing.code,
      requiresLab:
        input.type === SubjectType.LAB || (input.requiresLab !== undefined ? input.requiresLab : existing.requiresLab),
      updatedAt: new Date().toISOString(),
    };

    DEMO_SUBJECTS[index] = updated;

    await this.logAudit(adminUserId, "SUBJECT_UPDATED", "Subject", updated.id, {
      changes: input,
    });

    return updated;
  }

  static async deleteSubject(id: string, adminUserId: string) {
    const index = DEMO_SUBJECTS.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error("Subject not found");
    }

    DEMO_SUBJECTS[index].isActive = false;
    DEMO_SUBJECTS[index].updatedAt = new Date().toISOString();

    await this.logAudit(adminUserId, "SUBJECT_DEACTIVATED", "Subject", id);
    return DEMO_SUBJECTS[index];
  }

  // =========================================================================
  // 7. FACULTY MAPPING & WORKLOAD ALLOCATION
  // =========================================================================

  static async getFacultyMappings(filters?: {
    facultyId?: string;
    subjectId?: string;
    divisionId?: string;
    academicYear?: string;
    isActive?: boolean;
  }) {
    let list = [...DEMO_FACULTY_MAPPINGS];

    if (filters?.facultyId) {
      list = list.filter((m) => m.facultyId === filters.facultyId);
    }
    if (filters?.subjectId) {
      list = list.filter((m) => m.subjectId === filters.subjectId);
    }
    if (filters?.divisionId) {
      list = list.filter((m) => m.divisionId === filters.divisionId);
    }
    if (filters?.academicYear) {
      list = list.filter((m) => m.academicYear === filters.academicYear);
    }
    if (filters?.isActive !== undefined) {
      list = list.filter((m) => m.isActive === filters.isActive);
    }

    return list.map((map) => {
      const faculty = DEMO_USERS.find((u) => u.id === map.facultyId || u.facultyId === map.facultyId);
      const subject = DEMO_SUBJECTS.find((s) => s.id === map.subjectId);
      const division = DEMO_DIVISIONS.find((d) => d.id === map.divisionId);
      const cls = division ? DEMO_CLASSES.find((c) => c.id === division.classId) : null;

      return {
        ...map,
        facultyName: faculty ? `${faculty.firstName} ${faculty.lastName}` : "Unknown Faculty",
        facultyEmployeeId: faculty?.employeeId ?? faculty?.id ?? "N/A",
        subjectName: subject?.name ?? "Unknown Subject",
        subjectCode: subject?.code ?? "N/A",
        subjectType: subject?.type ?? SubjectType.THEORY,
        divisionName: division?.name ?? "Unknown Division",
        className: cls?.name ?? "Unknown Class",
        semester: cls?.semester ?? subject?.semester,
      };
    });
  }

  static async createFacultyMapping(input: CreateFacultyMappingInput, adminUserId: string) {
    // 1. Verify Faculty exists
    const faculty =
      DEMO_USERS.find(
        (u) =>
          (u.id === input.facultyId || u.facultyId === input.facultyId) &&
          (u.role === Role.FACULTY || u.role === Role.ADMIN)
      ) ||
      (input.facultyId.startsWith("demo-faculty-")
        ? {
            id: input.facultyId,
            facultyId: input.facultyId,
            firstName: input.facultyId === "demo-faculty-002" ? "Prof. Arvind" : "Dr. Sandeep",
            lastName: input.facultyId === "demo-faculty-002" ? "Kulkarni" : "Joshi",
            role: Role.FACULTY,
            departmentName: "Computer Engineering",
            employeeId: `EMP-${input.facultyId}`,
          }
        : null);
    if (!faculty) {
      throw new Error("Specified faculty member does not exist");
    }

    // 2. Verify Subject exists & active
    const subject = DEMO_SUBJECTS.find((s) => s.id === input.subjectId);
    if (!subject) {
      throw new Error("Specified subject does not exist");
    }
    if (!subject.isActive) {
      throw new Error("Cannot assign faculty to an inactive subject");
    }

    // 3. Verify Division exists & active
    const division = DEMO_DIVISIONS.find((d) => d.id === input.divisionId);
    if (!division) {
      throw new Error("Specified division does not exist");
    }
    if (!division.isActive) {
      throw new Error("Cannot assign faculty to an inactive division");
    }

    // 4. Duplicate mapping check
    const existing = DEMO_FACULTY_MAPPINGS.find(
      (m) =>
        (m.facultyId === input.facultyId || m.facultyId === faculty.id) &&
        m.subjectId === input.subjectId &&
        m.divisionId === input.divisionId &&
        m.academicYear === input.academicYear &&
        m.isActive
    );
    if (existing) {
      throw new Error(
        `Faculty is already mapped to ${subject.name} for division ${division.name} in ${input.academicYear}`
      );
    }

    const assignedHours = input.weeklyHours ?? subject.weeklyHours;

    const newMapping: DemoFacultyMapping = {
      id: `fm-${Date.now()}`,
      facultyId: faculty.id, // Normalize to User ID
      subjectId: input.subjectId,
      divisionId: input.divisionId,
      academicYear: input.academicYear,
      weeklyHours: assignedHours,
      isActive: input.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    DEMO_FACULTY_MAPPINGS.unshift(newMapping);

    await this.logAudit(adminUserId, "FACULTY_MAPPED", "FacultySubject", newMapping.id, {
      facultyId: newMapping.facultyId,
      subjectId: newMapping.subjectId,
      divisionId: newMapping.divisionId,
      weeklyHours: newMapping.weeklyHours,
      academicYear: newMapping.academicYear,
    });

    return newMapping;
  }

  static async updateFacultyMapping(
    id: string,
    input: UpdateFacultyMappingInput,
    adminUserId: string
  ) {
    const index = DEMO_FACULTY_MAPPINGS.findIndex((m) => m.id === id);
    if (index === -1) {
      throw new Error("Faculty mapping not found");
    }

    const updated: DemoFacultyMapping = {
      ...DEMO_FACULTY_MAPPINGS[index],
      ...input,
      weeklyHours: input.weeklyHours ?? DEMO_FACULTY_MAPPINGS[index].weeklyHours,
      updatedAt: new Date().toISOString(),
    };

    DEMO_FACULTY_MAPPINGS[index] = updated;

    await this.logAudit(adminUserId, "FACULTY_MAPPING_UPDATED", "FacultySubject", updated.id, {
      changes: input,
    });

    return updated;
  }

  static async deleteFacultyMapping(id: string, adminUserId: string) {
    const index = DEMO_FACULTY_MAPPINGS.findIndex((m) => m.id === id);
    if (index === -1) {
      throw new Error("Faculty mapping not found");
    }

    DEMO_FACULTY_MAPPINGS[index].isActive = false;
    DEMO_FACULTY_MAPPINGS[index].updatedAt = new Date().toISOString();

    await this.logAudit(adminUserId, "FACULTY_UNMAPPED", "FacultySubject", id);
    return DEMO_FACULTY_MAPPINGS[index];
  }

  /**
   * Deterministic faculty workload analytics
   */
  static async calculateFacultyWorkload(facultyId?: string): Promise<FacultyWorkloadSummary[]> {
    let facultyList = DEMO_USERS.filter((u) => u.role === Role.FACULTY || u.role === Role.ADMIN);

    if (facultyId) {
      facultyList = facultyList.filter((u) => u.id === facultyId || u.facultyId === facultyId);
    }

    return facultyList.map((faculty) => {
      const activeMappings = DEMO_FACULTY_MAPPINGS.filter(
        (m) => (m.facultyId === faculty.id || m.facultyId === faculty.facultyId) && m.isActive
      );

      const distinctSubjects = new Set(activeMappings.map((m) => m.subjectId));
      const distinctDivisions = new Set(activeMappings.map((m) => m.divisionId));

      let assignedWeeklyPeriods = 0;
      let theoryPeriods = 0;
      let labPeriods = 0;

      const allocations: FacultyWorkloadItem[] = activeMappings.map((map) => {
        const subject = DEMO_SUBJECTS.find((s) => s.id === map.subjectId);
        const division = DEMO_DIVISIONS.find((d) => d.id === map.divisionId);
        const hours = map.weeklyHours ?? subject?.weeklyHours ?? 3;
        const type = subject?.type ?? SubjectType.THEORY;

        assignedWeeklyPeriods += hours;
        if (type === SubjectType.LAB) {
          labPeriods += hours;
        } else {
          theoryPeriods += hours;
        }

        return {
          subjectId: map.subjectId,
          subjectCode: subject?.code ?? "N/A",
          subjectName: subject?.name ?? "Unknown Subject",
          type,
          divisionId: map.divisionId,
          divisionName: division?.name ?? "Unknown Division",
          weeklyHours: hours,
        };
      });

      return {
        facultyId: faculty.id,
        facultyName: `${faculty.firstName} ${faculty.lastName}`,
        employeeId: faculty.employeeId ?? faculty.id,
        departmentName: faculty.departmentName ?? "Computer Engineering",
        totalSubjects: distinctSubjects.size,
        totalDivisions: distinctDivisions.size,
        assignedWeeklyPeriods,
        theoryPeriods,
        labPeriods,
        scheduledWeeklyPeriods: assignedWeeklyPeriods, // synchronized with baseline
        maxWeeklyCapacity: 20, // Standard academic period limit
        allocations,
      };
    });
  }

  // =========================================================================
  // 8. ROOMS MANAGEMENT
  // =========================================================================

  static async getRooms(filters?: {
    type?: RoomType;
    isAvailable?: boolean;
    isActive?: boolean;
    search?: string;
  }) {
    let list = [...DEMO_ROOMS];

    if (filters?.type) {
      list = list.filter((r) => r.type === filters.type);
    }
    if (filters?.isAvailable !== undefined) {
      list = list.filter((r) => r.isAvailable === filters.isAvailable);
    }
    if (filters?.isActive !== undefined) {
      list = list.filter((r) => r.isActive === filters.isActive);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (r) => r.roomNumber.toLowerCase().includes(q) || r.building.toLowerCase().includes(q)
      );
    }

    return list.map((room) => {
      const dept = room.departmentId ? DEMO_DEPARTMENTS.find((d) => d.id === room.departmentId) : null;
      return {
        ...room,
        departmentName: dept?.name ?? "General / Unassigned",
      };
    });
  }

  static async getRoomById(id: string) {
    const room = DEMO_ROOMS.find((r) => r.id === id);
    if (!room) return null;

    const department = room.departmentId ? DEMO_DEPARTMENTS.find((d) => d.id === room.departmentId) : null;
    const laboratories = DEMO_LABORATORIES.filter((l) => l.roomId === room.id);

    return {
      ...room,
      department,
      laboratories,
    };
  }

  static async createRoom(input: CreateRoomInput, adminUserId: string) {
    // 1. Capacity validation
    if (input.capacity <= 0) {
      throw new Error("Room capacity must be strictly greater than 0");
    }

    // 2. Room number uniqueness
    const duplicate = DEMO_ROOMS.find(
      (r) => r.roomNumber.toLowerCase() === input.roomNumber.toLowerCase()
    );
    if (duplicate) {
      throw new Error(`Room with number '${input.roomNumber}' already exists`);
    }

    const newRoom: DemoRoom = {
      id: `room-${Date.now()}`,
      roomNumber: input.roomNumber.trim(),
      building: input.building.trim(),
      floor: input.floor,
      capacity: input.capacity,
      type: input.type ?? RoomType.CLASSROOM,
      hasProjector: input.hasProjector ?? true,
      isAvailable: input.isAvailable ?? true,
      departmentId: input.departmentId ?? null,
      isActive: input.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    DEMO_ROOMS.unshift(newRoom);

    await this.logAudit(adminUserId, "ROOM_CREATED", "Room", newRoom.id, {
      roomNumber: newRoom.roomNumber,
      building: newRoom.building,
      type: newRoom.type,
      capacity: newRoom.capacity,
    });

    return newRoom;
  }

  static async updateRoom(id: string, input: UpdateRoomInput, adminUserId: string) {
    const index = DEMO_ROOMS.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error("Room not found");
    }

    if (input.capacity !== undefined && input.capacity <= 0) {
      throw new Error("Room capacity must be strictly greater than 0");
    }

    if (input.roomNumber && input.roomNumber.toLowerCase() !== DEMO_ROOMS[index].roomNumber.toLowerCase()) {
      const duplicate = DEMO_ROOMS.find(
        (r) => r.id !== id && r.roomNumber.toLowerCase() === input.roomNumber!.toLowerCase()
      );
      if (duplicate) {
        throw new Error(`Room with number '${input.roomNumber}' already exists`);
      }
    }

    const updated: DemoRoom = {
      ...DEMO_ROOMS[index],
      ...input,
      updatedAt: new Date().toISOString(),
    };

    DEMO_ROOMS[index] = updated;

    await this.logAudit(adminUserId, "ROOM_UPDATED", "Room", updated.id, {
      changes: input,
    });

    return updated;
  }

  static async deleteRoom(id: string, adminUserId: string) {
    const index = DEMO_ROOMS.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error("Room not found");
    }

    DEMO_ROOMS[index].isActive = false;
    DEMO_ROOMS[index].isAvailable = false;
    DEMO_ROOMS[index].updatedAt = new Date().toISOString();

    await this.logAudit(adminUserId, "ROOM_DEACTIVATED", "Room", id);
    return DEMO_ROOMS[index];
  }

  // =========================================================================
  // 9. LABORATORY MANAGEMENT
  // =========================================================================

  static async getLaboratories(filters?: { departmentId?: string; isActive?: boolean; search?: string }) {
    let list = [...DEMO_LABORATORIES];

    if (filters?.departmentId) {
      list = list.filter((l) => l.departmentId === filters.departmentId);
    }
    if (filters?.isActive !== undefined) {
      list = list.filter((l) => l.isActive === filters.isActive);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (l) => l.name.toLowerCase().includes(q) || l.code.toLowerCase().includes(q)
      );
    }

    return list.map((lab) => {
      const dept = DEMO_DEPARTMENTS.find((d) => d.id === lab.departmentId);
      const room = lab.roomId ? DEMO_ROOMS.find((r) => r.id === lab.roomId) : null;
      return {
        ...lab,
        departmentName: dept?.name ?? "Unknown Department",
        departmentCode: dept?.code ?? "N/A",
        roomNumber: room?.roomNumber ?? "Unassigned Physical Room",
        roomBuilding: room?.building ?? null,
      };
    });
  }

  static async getLaboratoryById(id: string) {
    const lab = DEMO_LABORATORIES.find((l) => l.id === id);
    if (!lab) return null;

    const department = DEMO_DEPARTMENTS.find((d) => d.id === lab.departmentId);
    const room = lab.roomId ? DEMO_ROOMS.find((r) => r.id === lab.roomId) : null;
    const subjects = DEMO_SUBJECTS.filter((s) => s.laboratoryId === lab.id);

    return {
      ...lab,
      department,
      room,
      subjects,
    };
  }

  static async createLaboratory(input: CreateLaboratoryInput, adminUserId: string) {
    // 1. Department must exist and be active
    const dept = DEMO_DEPARTMENTS.find((d) => d.id === input.departmentId);
    if (!dept) {
      throw new Error("Specified department does not exist");
    }
    if (!dept.isActive) {
      throw new Error("Cannot associate laboratory with an inactive department");
    }

    // 2. Code uniqueness
    const duplicate = DEMO_LABORATORIES.find(
      (l) => l.code.toUpperCase() === input.code.toUpperCase()
    );
    if (duplicate) {
      throw new Error(`Laboratory with code '${input.code}' already exists`);
    }

    // 3. Room verification if provided
    if (input.roomId) {
      const room = DEMO_ROOMS.find((r) => r.id === input.roomId);
      if (!room) {
        throw new Error("Specified physical room does not exist");
      }
      if (!room.isActive) {
        throw new Error("Cannot associate laboratory with an inactive room");
      }
      if (room.type !== RoomType.LAB) {
        throw new Error(`Room '${room.roomNumber}' is of type '${room.type}', not 'LAB'`);
      }
    }

    const newLab: DemoLaboratory = {
      id: `lab-${Date.now()}`,
      name: input.name.trim(),
      code: input.code.trim().toUpperCase(),
      departmentId: input.departmentId,
      roomId: input.roomId ?? null,
      capacity: input.capacity ?? 30,
      equipment: input.equipment ?? [],
      labAssistant: input.labAssistant ?? null,
      isActive: input.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    DEMO_LABORATORIES.unshift(newLab);

    await this.logAudit(adminUserId, "LABORATORY_CREATED", "Laboratory", newLab.id, {
      code: newLab.code,
      name: newLab.name,
      roomId: newLab.roomId,
    });

    return newLab;
  }

  static async updateLaboratory(id: string, input: UpdateLaboratoryInput, adminUserId: string) {
    const index = DEMO_LABORATORIES.findIndex((l) => l.id === id);
    if (index === -1) {
      throw new Error("Laboratory not found");
    }

    const existing = DEMO_LABORATORIES[index];

    if (input.code && input.code.toUpperCase() !== existing.code.toUpperCase()) {
      const duplicate = DEMO_LABORATORIES.find(
        (l) => l.id !== id && l.code.toUpperCase() === input.code!.toUpperCase()
      );
      if (duplicate) {
        throw new Error(`Laboratory with code '${input.code}' already exists`);
      }
    }

    if (input.roomId && input.roomId !== existing.roomId) {
      const room = DEMO_ROOMS.find((r) => r.id === input.roomId);
      if (!room || !room.isActive) {
        throw new Error("Specified physical room does not exist or is inactive");
      }
      if (room.type !== RoomType.LAB) {
        throw new Error(`Room '${room.roomNumber}' is of type '${room.type}', not 'LAB'`);
      }
    }

    const updated: DemoLaboratory = {
      ...existing,
      ...input,
      code: input.code ? input.code.toUpperCase() : existing.code,
      updatedAt: new Date().toISOString(),
    };

    DEMO_LABORATORIES[index] = updated;

    await this.logAudit(adminUserId, "LABORATORY_UPDATED", "Laboratory", updated.id, {
      changes: input,
    });

    return updated;
  }

  static async deleteLaboratory(id: string, adminUserId: string) {
    const index = DEMO_LABORATORIES.findIndex((l) => l.id === id);
    if (index === -1) {
      throw new Error("Laboratory not found");
    }

    DEMO_LABORATORIES[index].isActive = false;
    DEMO_LABORATORIES[index].updatedAt = new Date().toISOString();

    await this.logAudit(adminUserId, "LABORATORY_DEACTIVATED", "Laboratory", id);
    return DEMO_LABORATORIES[index];
  }

  // =========================================================================
  // 10. TIMETABLE PREREQUISITES & INTEGRATION
  // =========================================================================

  /**
   * Validates whether a division is ready for conflict-free timetable generation
   */
  static async validateTimetablePrerequisites(divisionId: string): Promise<{
    isValid: boolean;
    divisionName: string;
    errors: string[];
    warnings: string[];
  }> {
    const division = DEMO_DIVISIONS.find((d) => d.id === divisionId);
    if (!division) {
      return {
        isValid: false,
        divisionName: "Unknown Division",
        errors: [`Division with ID '${divisionId}' not found`],
        warnings: [],
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    const parentClass = DEMO_CLASSES.find((c) => c.id === division.classId);
    if (!parentClass) {
      errors.push("Division does not belong to any recognized academic class");
    }

    // Get mapped subjects for this division
    const mappings = DEMO_FACULTY_MAPPINGS.filter((m) => m.divisionId === division.id && m.isActive);
    if (mappings.length === 0) {
      errors.push("No subjects or faculty members mapped to this division");
    }

    // Check each mapped subject
    for (const mapping of mappings) {
      const subject = DEMO_SUBJECTS.find((s) => s.id === mapping.subjectId);
      if (!subject || !subject.isActive) {
        errors.push(`Inactive or missing subject mapped to division: ID ${mapping.subjectId}`);
        continue;
      }

      const faculty =
        DEMO_USERS.find(
          (u) => u.id === mapping.facultyId || u.facultyId === mapping.facultyId
        ) ||
        (mapping.facultyId.startsWith("demo-faculty-")
          ? { id: mapping.facultyId, firstName: "Faculty" }
          : null);
      if (!faculty) {
        errors.push(`Mapped faculty member for subject '${subject.name}' not found`);
      }

      // Check lab subject requirements
      if (subject.type === SubjectType.LAB || subject.requiresLab) {
        const labRooms = DEMO_ROOMS.filter(
          (r) => r.type === RoomType.LAB && r.isActive && r.isAvailable
        );
        if (labRooms.length === 0) {
          errors.push(
            `Lab subject '${subject.name}' requires a LABORATORY room, but no active lab rooms exist`
          );
        }
      }
    }

    // Check classroom capacity vs division capacity
    const availableClassrooms = DEMO_ROOMS.filter(
      (r) => r.type === RoomType.CLASSROOM && r.isActive && r.isAvailable
    );
    if (availableClassrooms.length === 0) {
      errors.push("No active classrooms available for lecture periods");
    } else {
      const fitsAny = availableClassrooms.some((r) => r.capacity >= division.capacity);
      if (!fitsAny) {
        warnings.push(
          `Division capacity (${division.capacity}) exceeds all available classrooms. Maximum room capacity is ${Math.max(...availableClassrooms.map((r) => r.capacity))}`
        );
      }
    }

    return {
      isValid: errors.length === 0,
      divisionName: division.name,
      errors,
      warnings,
    };
  }

  // =========================================================================
  // 11. CONFIGURATION HEALTH AUDIT ENGINE
  // =========================================================================

  /**
   * System-wide academic configuration health check
   */
  static async auditConfigurationHealth(): Promise<ConfigurationHealthReport> {
    const checks: ConfigurationHealthIssue[] = [];
    let errorCount = 0;
    let warningCount = 0;

    // Check 1: Unmapped Subjects
    const activeSubjects = DEMO_SUBJECTS.filter((s) => s.isActive);
    const unmappedSubjects: Array<{ id: string; name: string; details?: string }> = [];

    for (const subj of activeSubjects) {
      const hasMapping = DEMO_FACULTY_MAPPINGS.some(
        (m) => m.subjectId === subj.id && m.isActive
      );
      if (!hasMapping) {
        unmappedSubjects.push({
          id: subj.id,
          name: `${subj.code} - ${subj.name}`,
          details: `Semester ${subj.semester} (${subj.type})`,
        });
      }
    }

    if (unmappedSubjects.length > 0) {
      warningCount += 1;
      checks.push({
        id: "UNMAPPED_SUBJECTS",
        title: "Active Subjects Without Assigned Faculty",
        severity: "WARNING",
        count: unmappedSubjects.length,
        description: `${unmappedSubjects.length} active academic subjects do not have faculty members allocated.`,
        remediationHint: "Assign qualified faculty to these subjects in Faculty Allocation.",
        items: unmappedSubjects,
      });
    } else {
      checks.push({
        id: "UNMAPPED_SUBJECTS",
        title: "Subject Faculty Allocation",
        severity: "PASS",
        count: 0,
        description: "All active academic subjects have allocated faculty members.",
        remediationHint: "No action required.",
        items: [],
      });
    }

    // Check 2: Unmapped Faculty Members (Zero workload)
    const facultyUsers = DEMO_USERS.filter((u) => u.role === Role.FACULTY);
    const unmappedFaculty: Array<{ id: string; name: string; details?: string }> = [];

    for (const fac of facultyUsers) {
      const hasAllocation = DEMO_FACULTY_MAPPINGS.some(
        (m) => (m.facultyId === fac.id || m.facultyId === fac.facultyId) && m.isActive
      );
      if (!hasAllocation) {
        unmappedFaculty.push({
          id: fac.id,
          name: `${fac.firstName} ${fac.lastName}`,
          details: `${fac.departmentName ?? "Faculty"} (${fac.employeeId ?? "EMP"})`,
        });
      }
    }

    if (unmappedFaculty.length > 0) {
      warningCount += 1;
      checks.push({
        id: "UNMAPPED_FACULTY",
        title: "Faculty Without Teaching Allocation",
        severity: "WARNING",
        count: unmappedFaculty.length,
        description: `${unmappedFaculty.length} registered faculty members have zero assigned teaching periods.`,
        remediationHint: "Assign teaching workloads or verify sabbatical / administrative status.",
        items: unmappedFaculty,
      });
    } else {
      checks.push({
        id: "UNMAPPED_FACULTY",
        title: "Faculty Teaching Workload",
        severity: "PASS",
        count: 0,
        description: "All active faculty members have assigned teaching responsibilities.",
        remediationHint: "No action required.",
        items: [],
      });
    }

    // Check 3: Divisions Without Subjects
    const activeDivisions = DEMO_DIVISIONS.filter((d) => d.isActive);
    const emptyDivisions: Array<{ id: string; name: string; details?: string }> = [];

    for (const div of activeDivisions) {
      const hasSubjects = DEMO_FACULTY_MAPPINGS.some(
        (m) => m.divisionId === div.id && m.isActive
      );
      if (!hasSubjects) {
        const cls = DEMO_CLASSES.find((c) => c.id === div.classId);
        emptyDivisions.push({
          id: div.id,
          name: `${div.name} (${cls?.name ?? "Class"})`,
          details: `Capacity: ${div.capacity} students`,
        });
      }
    }

    if (emptyDivisions.length > 0) {
      errorCount += 1;
      checks.push({
        id: "DIVISIONS_WITHOUT_SUBJECTS",
        title: "Divisions Lacking Academic Subjects",
        severity: "ERROR",
        count: emptyDivisions.length,
        description: `${emptyDivisions.length} student divisions do not have any teaching curriculum assigned.`,
        remediationHint: "Add subject mappings for these divisions prior to timetable generation.",
        items: emptyDivisions,
      });
    } else {
      checks.push({
        id: "DIVISIONS_WITHOUT_SUBJECTS",
        title: "Division Curriculum Coverage",
        severity: "PASS",
        count: 0,
        description: "All active divisions have scheduled academic courses.",
        remediationHint: "No action required.",
        items: [],
      });
    }

    // Check 4: Laboratories Without Valid Physical Rooms
    const activeLabs = DEMO_LABORATORIES.filter((l) => l.isActive);
    const unlinkedLabs: Array<{ id: string; name: string; details?: string }> = [];

    for (const lab of activeLabs) {
      if (!lab.roomId) {
        unlinkedLabs.push({
          id: lab.id,
          name: `${lab.code} - ${lab.name}`,
          details: "No physical room assigned",
        });
      } else {
        const room = DEMO_ROOMS.find((r) => r.id === lab.roomId);
        if (!room || !room.isActive) {
          unlinkedLabs.push({
            id: lab.id,
            name: `${lab.code} - ${lab.name}`,
            details: `Linked to nonexistent or inactive room ID '${lab.roomId}'`,
          });
        }
      }
    }

    if (unlinkedLabs.length > 0) {
      warningCount += 1;
      checks.push({
        id: "LABS_WITHOUT_ROOMS",
        title: "Laboratories Lacking Physical Room",
        severity: "WARNING",
        count: unlinkedLabs.length,
        description: `${unlinkedLabs.length} laboratories are not mapped to an active physical room.`,
        remediationHint: "Assign each laboratory entity to a physical room in Rooms & Labs.",
        items: unlinkedLabs,
      });
    } else {
      checks.push({
        id: "LABS_WITHOUT_ROOMS",
        title: "Laboratory Room Linkages",
        severity: "PASS",
        count: 0,
        description: "All laboratories are mapped to active physical facilities.",
        remediationHint: "No action required.",
        items: [],
      });
    }

    // Check 5: Inactive Resources Referenced in Active Mappings
    const inactiveReferences: Array<{ id: string; name: string; details?: string }> = [];
    for (const mapping of DEMO_FACULTY_MAPPINGS.filter((m) => m.isActive)) {
      const subject = DEMO_SUBJECTS.find((s) => s.id === mapping.subjectId);
      if (subject && !subject.isActive) {
        inactiveReferences.push({
          id: mapping.id,
          name: `Mapping for subject: ${subject.name}`,
          details: "Subject is marked INACTIVE",
        });
      }
      const division = DEMO_DIVISIONS.find((d) => d.id === mapping.divisionId);
      if (division && !division.isActive) {
        inactiveReferences.push({
          id: mapping.id,
          name: `Mapping for division: ${division.name}`,
          details: "Division is marked INACTIVE",
        });
      }
    }

    if (inactiveReferences.length > 0) {
      errorCount += 1;
      checks.push({
        id: "INACTIVE_RESOURCES_IN_USE",
        title: "Inactive Resources in Active Mappings",
        severity: "ERROR",
        count: inactiveReferences.length,
        description: `${inactiveReferences.length} active mappings reference deactivated subjects or divisions.`,
        remediationHint: "Reactivate referenced entities or archive obsolete mappings.",
        items: inactiveReferences,
      });
    } else {
      checks.push({
        id: "INACTIVE_RESOURCES_IN_USE",
        title: "Active Reference Integrity",
        severity: "PASS",
        count: 0,
        description: "No inactive subjects or divisions are referenced by active mappings.",
        remediationHint: "No action required.",
        items: [],
      });
    }

    // Check 6: Room and Division Capacity Integrity
    const invalidCapacityItems: Array<{ id: string; name: string; details?: string }> = [];
    for (const r of DEMO_ROOMS) {
      if (r.capacity <= 0) {
        invalidCapacityItems.push({
          id: r.id,
          name: `Room: ${r.roomNumber}`,
          details: `Capacity is ${r.capacity}`,
        });
      }
    }
    for (const d of DEMO_DIVISIONS) {
      if (d.capacity <= 0) {
        invalidCapacityItems.push({
          id: d.id,
          name: `Division: ${d.name}`,
          details: `Capacity is ${d.capacity}`,
        });
      }
    }

    if (invalidCapacityItems.length > 0) {
      errorCount += 1;
      checks.push({
        id: "INVALID_CAPACITY",
        title: "Invalid Room or Division Capacity",
        severity: "ERROR",
        count: invalidCapacityItems.length,
        description: `${invalidCapacityItems.length} resources have zero or negative capacity.`,
        remediationHint: "Set valid positive capacities for all rooms and divisions.",
        items: invalidCapacityItems,
      });
    } else {
      checks.push({
        id: "INVALID_CAPACITY",
        title: "Capacity Integrity Check",
        severity: "PASS",
        count: 0,
        description: "All rooms and divisions have valid positive capacities.",
        remediationHint: "No action required.",
        items: [],
      });
    }

    // Determine overall system health
    let status: "HEALTHY" | "WARNING" | "CRITICAL" = "HEALTHY";
    if (errorCount > 0) {
      status = "CRITICAL";
    } else if (warningCount > 0) {
      status = "WARNING";
    }

    return {
      timestamp: new Date().toISOString(),
      status,
      metrics: {
        departmentsCount: DEMO_DEPARTMENTS.filter((d) => d.isActive).length,
        programsCount: DEMO_PROGRAMS.filter((p) => p.isActive).length,
        batchesCount: DEMO_BATCHES.filter((b) => b.isActive).length,
        divisionsCount: DEMO_DIVISIONS.filter((d) => d.isActive).length,
        subjectsCount: DEMO_SUBJECTS.filter((s) => s.isActive).length,
        facultyCount: facultyUsers.length,
        mappingsCount: DEMO_FACULTY_MAPPINGS.filter((m) => m.isActive).length,
        roomsCount: DEMO_ROOMS.filter((r) => r.isActive).length,
        laboratoriesCount: DEMO_LABORATORIES.filter((l) => l.isActive).length,
      },
      totalIssues: errorCount + warningCount,
      errorCount,
      warningCount,
      checks,
    };
  }
}
