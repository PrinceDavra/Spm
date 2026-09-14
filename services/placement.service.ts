import { prisma } from "@/lib/prisma";
import { isDatabaseOnline } from "@/lib/db-health";
import {
  Role,
  PlacementDriveStatus,
  EmploymentType,
  ApplicationStatus,
  NotificationType,
} from "@prisma/client";
import {
  DEMO_COMPANIES_STORE,
  DEMO_DRIVES_STORE,
  DEMO_APPLICATIONS_STORE,
  DemoCompany,
  DemoPlacementDrive,
  DemoPlacementApplication,
  DemoApplicationStatusHistory,
} from "@/lib/placement/demo-placements";
import {
  CreateCompanyInput,
  UpdateCompanyInput,
  CreateDriveInput,
  UpdateDriveInput,
} from "@/validators/placement.schema";
import { NotificationService } from "@/services/notification.service";

export interface StudentProfileForEligibility {
  cgpa: number;
  departmentName: string;
  semester: number;
  activeBacklogs?: number;
  skills?: string[];
  batchYear?: string;
}

export interface EligibilityEvaluation {
  isEligible: boolean;
  criteria: {
    name: string;
    required: string;
    actual: string;
    passed: boolean;
  }[];
  failureReasons: string[];
}

export class PlacementService {
  // ==========================================
  // COMPANIES
  // ==========================================

  static async getCompanies(search?: string): Promise<DemoCompany[]> {
    let list = [...DEMO_COMPANIES_STORE];
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.industry.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q)
      );
    }
    return list;
  }

  static async getCompanyById(idOrSlug: string): Promise<DemoCompany | null> {
    const company = DEMO_COMPANIES_STORE.find(
      (c) => c.id === idOrSlug || c.slug === idOrSlug
    );
    return company || null;
  }

  static async createCompany(
    input: CreateCompanyInput,
    officerUserId: string,
    role: Role | string = Role.PLACEMENT_OFFICER
  ): Promise<DemoCompany> {
    if (role !== Role.PLACEMENT_OFFICER && role !== Role.ADMIN) {
      throw new Error("Forbidden: Only placement officers and administrators can add recruiting partners");
    }

    const slug = input.slug || this.slugify(input.name);
    const existing = DEMO_COMPANIES_STORE.find(
      (c) => c.name.toLowerCase() === input.name.toLowerCase() || c.slug === slug
    );
    if (existing) {
      throw new Error(`A company with the name "${input.name}" or slug "${slug}" already exists`);
    }

    const now = new Date().toISOString();
    const newCompany: DemoCompany = {
      id: `comp-${Date.now().toString(36)}`,
      name: input.name,
      slug,
      website: input.website || "",
      industry: input.industry,
      logoUrl: input.logoUrl || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300&q=80",
      description: input.description || "",
      location: input.location || "PAN India",
      companySize: input.companySize || "1,000+",
      contactPerson: input.contactPerson || "University Relations",
      contactEmail: input.contactEmail || `campus@${slug}.com`,
      contactPhone: input.contactPhone || "+91 80 0000 0000",
      createdAt: now,
      updatedAt: now,
    };

    DEMO_COMPANIES_STORE.unshift(newCompany);

    await this.recordAuditLog({
      action: "CREATE_COMPANY",
      entity: "PlacementCompany",
      entityId: newCompany.id,
      userId: officerUserId,
      details: { name: newCompany.name, industry: newCompany.industry },
    });

    return newCompany;
  }

  static async updateCompany(
    id: string,
    input: UpdateCompanyInput,
    officerUserId: string,
    role: Role | string = Role.PLACEMENT_OFFICER
  ): Promise<DemoCompany> {
    if (role !== Role.PLACEMENT_OFFICER && role !== Role.ADMIN) {
      throw new Error("Forbidden: Only placement officers and administrators can update company details");
    }

    const company = DEMO_COMPANIES_STORE.find((c) => c.id === id);
    if (!company) throw new Error("Company not found");

    if (input.name && input.name !== company.name) {
      const existing = DEMO_COMPANIES_STORE.find(
        (c) => c.id !== id && c.name.toLowerCase() === input.name!.toLowerCase()
      );
      if (existing) throw new Error(`Company name "${input.name}" is already in use`);
      company.name = input.name;
    }

    if (input.website !== undefined) company.website = input.website || "";
    if (input.industry !== undefined) company.industry = input.industry;
    if (input.logoUrl !== undefined) company.logoUrl = input.logoUrl || company.logoUrl;
    if (input.description !== undefined) company.description = input.description || "";
    if (input.location !== undefined) company.location = input.location || company.location;
    if (input.companySize !== undefined) company.companySize = input.companySize || company.companySize;
    if (input.contactPerson !== undefined) company.contactPerson = input.contactPerson || company.contactPerson;
    if (input.contactEmail !== undefined) company.contactEmail = input.contactEmail || company.contactEmail;
    if (input.contactPhone !== undefined) company.contactPhone = input.contactPhone || company.contactPhone;
    company.updatedAt = new Date().toISOString();

    return company;
  }

  // ==========================================
  // PLACEMENT DRIVES
  // ==========================================

  static async getDrives(options: {
    userId?: string;
    role?: Role | string;
    userRole?: Role | string;
    search?: string;
    department?: string;
    employmentType?: EmploymentType;
    companyId?: string;
    location?: string;
    status?: PlacementDriveStatus;
    eligibleOnly?: boolean;
    studentProfile?: StudentProfileForEligibility;
    limit?: number;
    offset?: number;
  }): Promise<{ drives: any[]; total: number }> {
    const role = options.role || options.userRole;
    const {
      search,
      department,
      employmentType,
      companyId,
      location,
      status,
      eligibleOnly = false,
      studentProfile,
      limit = 100,
      offset = 0,
    } = options;

    let list = [...DEMO_DRIVES_STORE];

    // Visibility rule: Draft drives hidden from non-officers/non-admins
    if (role !== Role.PLACEMENT_OFFICER && role !== Role.ADMIN) {
      list = list.filter((d) => d.status !== PlacementDriveStatus.DRAFT);
    }

    // Status filter
    if (status) {
      list = list.filter((d) => d.status === status);
    }

    // Company filter
    if (companyId) {
      list = list.filter((d) => d.companyId === companyId);
    }

    // Employment type filter
    if (employmentType) {
      list = list.filter((d) => d.employmentType === employmentType);
    }

    // Location filter
    if (location && location.trim()) {
      const locQ = location.toLowerCase().trim();
      list = list.filter((d) => d.location.toLowerCase().includes(locQ));
    }

    // Department filter
    if (department) {
      list = list.filter(
        (d) =>
          d.allowedDepartments.length === 0 ||
          d.allowedDepartments.includes(department)
      );
    }

    // Keyword search
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.companyName.toLowerCase().includes(q) ||
          d.role.toLowerCase().includes(q) ||
          d.location.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q)
      );
    }

    // Enrich drives with eligibility and application counts
    const enriched = list.map((drive) => {
      const driveApps = DEMO_APPLICATIONS_STORE.filter((a) => a.driveId === drive.id);
      const isEligibleObj = studentProfile
        ? this.checkEligibility(drive, studentProfile)
        : null;

      return {
        ...drive,
        applicationCount: driveApps.length,
        eligibility: isEligibleObj,
        isEligible: isEligibleObj ? isEligibleObj.isEligible : true,
      };
    });

    let filtered = enriched;
    if (eligibleOnly && studentProfile) {
      filtered = filtered.filter((d) => d.isEligible);
    }

    const paginated = filtered.slice(offset, offset + limit);
    return { drives: paginated, total: filtered.length };
  }

  static async getDriveById(
    idOrSlug: string,
    userId?: string,
    role?: Role | string,
    studentProfile?: StudentProfileForEligibility
  ): Promise<any | null> {
    const drive = DEMO_DRIVES_STORE.find(
      (d) => d.id === idOrSlug || d.slug === idOrSlug
    );
    if (!drive) return null;

    const company = DEMO_COMPANIES_STORE.find((c) => c.id === drive.companyId);
    const driveApps = DEMO_APPLICATIONS_STORE.filter((a) => a.driveId === drive.id);
    const userApp = userId
      ? DEMO_APPLICATIONS_STORE.find(
          (a) => a.driveId === drive.id && a.studentUserId === userId
        )
      : null;

    const eligibility = studentProfile
      ? this.checkEligibility(drive, studentProfile)
      : null;

    return {
      ...drive,
      company: company || null,
      applicationCount: driveApps.length,
      userApplication: userApp || null,
      eligibility,
      isEligible: eligibility ? eligibility.isEligible : true,
    };
  }

  static async createDrive(
    input: CreateDriveInput,
    officerUserId: string,
    role: Role | string = Role.PLACEMENT_OFFICER
  ): Promise<DemoPlacementDrive> {
    if (role !== Role.PLACEMENT_OFFICER && role !== Role.ADMIN) {
      throw new Error("Forbidden: Only placement officers and administrators can create placement drives");
    }

    const company = DEMO_COMPANIES_STORE.find((c) => c.id === input.companyId);
    if (!company) throw new Error("Company not found");

    const slug = input.slug || this.slugify(`${company.name}-${input.role}-${Date.now().toString(36)}`);
    const now = new Date().toISOString();

    const newDrive: DemoPlacementDrive = {
      id: `drv-${Date.now().toString(36)}`,
      companyId: company.id,
      companyName: company.name,
      companyLogo: company.logoUrl,
      title: input.title,
      slug,
      role: input.role,
      employmentType: input.employmentType,
      location: input.location,
      packageMin: input.packageMin,
      packageMax: input.packageMax,
      currency: input.currency || "INR",
      description: input.description,
      applicationDeadline: input.applicationDeadline,
      driveDate: input.driveDate || null,
      status: input.status || PlacementDriveStatus.DRAFT,
      minCgpa: input.minCgpa !== undefined ? input.minCgpa : 6.0,
      maxBacklogs: input.maxBacklogs !== undefined ? input.maxBacklogs : 0,
      allowedDepartments: input.allowedDepartments || [],
      allowedSemesters: input.allowedSemesters || [],
      requiredSkills: input.requiredSkills || [],
      batchCriteria: input.batchCriteria || null,
      bondDetails: input.bondDetails || null,
      selectionRounds: input.selectionRounds && input.selectionRounds.length > 0
        ? input.selectionRounds
        : ["Online Assessment", "Technical Interview", "HR Interview"],
      createdBy: officerUserId,
      createdAt: now,
      updatedAt: now,
    };

    DEMO_DRIVES_STORE.unshift(newDrive);

    await this.recordAuditLog({
      action: "CREATE_PLACEMENT_DRIVE",
      entity: "PlacementDrive",
      entityId: newDrive.id,
      userId: officerUserId,
      details: { title: newDrive.title, company: company.name, role: newDrive.role },
    });

    return newDrive;
  }

  static async updateDrive(
    id: string,
    input: UpdateDriveInput,
    officerUserId: string,
    role: Role | string = Role.PLACEMENT_OFFICER
  ): Promise<DemoPlacementDrive> {
    if (role !== Role.PLACEMENT_OFFICER && role !== Role.ADMIN) {
      throw new Error("Forbidden: Only placement officers and administrators can edit placement drives");
    }

    const drive = DEMO_DRIVES_STORE.find((d) => d.id === id);
    if (!drive) throw new Error("Drive not found");

    if (input.title !== undefined) drive.title = input.title;
    if (input.role !== undefined) drive.role = input.role;
    if (input.employmentType !== undefined) drive.employmentType = input.employmentType;
    if (input.location !== undefined) drive.location = input.location;
    if (input.packageMin !== undefined) drive.packageMin = input.packageMin;
    if (input.packageMax !== undefined) drive.packageMax = input.packageMax;
    if (input.currency !== undefined) drive.currency = input.currency;
    if (input.description !== undefined) drive.description = input.description;
    if (input.applicationDeadline !== undefined) drive.applicationDeadline = input.applicationDeadline;
    if (input.driveDate !== undefined) drive.driveDate = input.driveDate;
    if (input.status !== undefined) drive.status = input.status;
    if (input.minCgpa !== undefined) drive.minCgpa = input.minCgpa;
    if (input.maxBacklogs !== undefined) drive.maxBacklogs = input.maxBacklogs;
    if (input.allowedDepartments !== undefined) drive.allowedDepartments = input.allowedDepartments;
    if (input.allowedSemesters !== undefined) drive.allowedSemesters = input.allowedSemesters;
    if (input.requiredSkills !== undefined) drive.requiredSkills = input.requiredSkills;
    if (input.batchCriteria !== undefined) drive.batchCriteria = input.batchCriteria;
    if (input.bondDetails !== undefined) drive.bondDetails = input.bondDetails;
    if (input.selectionRounds !== undefined) drive.selectionRounds = input.selectionRounds;

    drive.updatedAt = new Date().toISOString();

    await this.recordAuditLog({
      action: "UPDATE_PLACEMENT_DRIVE",
      entity: "PlacementDrive",
      entityId: drive.id,
      userId: officerUserId,
      details: { title: drive.title, status: drive.status },
    });

    return drive;
  }

  static async publishDrive(
    id: string,
    officerUserId: string,
    role: Role | string = Role.PLACEMENT_OFFICER
  ): Promise<DemoPlacementDrive> {
    if (role !== Role.PLACEMENT_OFFICER && role !== Role.ADMIN) {
      throw new Error("Forbidden: Only placement officers can publish drives");
    }

    const drive = DEMO_DRIVES_STORE.find((d) => d.id === id);
    if (!drive) throw new Error("Drive not found");

    drive.status = PlacementDriveStatus.PUBLISHED;
    drive.updatedAt = new Date().toISOString();

    await this.recordAuditLog({
      action: "PUBLISH_PLACEMENT_DRIVE",
      entity: "PlacementDrive",
      entityId: drive.id,
      userId: officerUserId,
      details: { title: drive.title },
    });

    return drive;
  }

  static async closeDrive(
    id: string,
    officerUserId: string,
    role: Role | string = Role.PLACEMENT_OFFICER
  ): Promise<DemoPlacementDrive> {
    if (role !== Role.PLACEMENT_OFFICER && role !== Role.ADMIN) {
      throw new Error("Forbidden: Only placement officers can close drives");
    }

    const drive = DEMO_DRIVES_STORE.find((d) => d.id === id);
    if (!drive) throw new Error("Drive not found");

    drive.status = PlacementDriveStatus.APPLICATION_CLOSED;
    drive.updatedAt = new Date().toISOString();

    await this.recordAuditLog({
      action: "CLOSE_PLACEMENT_DRIVE",
      entity: "PlacementDrive",
      entityId: drive.id,
      userId: officerUserId,
      details: { title: drive.title },
    });

    return drive;
  }

  static async closeDriveApplications(
    id: string,
    officerUserId: string,
    role: Role | string = Role.PLACEMENT_OFFICER
  ): Promise<DemoPlacementDrive> {
    return this.closeDrive(id, officerUserId, role);
  }

  // ==========================================
  // SERVER-SIDE ELIGIBILITY ENGINE
  // ==========================================

  static checkEligibility(
    drive: DemoPlacementDrive,
    student: StudentProfileForEligibility
  ): EligibilityEvaluation {
    const criteria: {
      name: string;
      required: string;
      actual: string;
      passed: boolean;
    }[] = [];
    const failureReasons: string[] = [];

    // 1. Minimum CGPA Check
    const cgpaPassed = student.cgpa >= drive.minCgpa;
    criteria.push({
      name: "Minimum CGPA",
      required: `>= ${drive.minCgpa.toFixed(2)}`,
      actual: student.cgpa.toFixed(2),
      passed: cgpaPassed,
    });
    if (!cgpaPassed) {
      failureReasons.push(`Your CGPA (${student.cgpa.toFixed(2)}) is below the required ${drive.minCgpa.toFixed(2)}.`);
    }

    // 2. Active Backlogs Check
    const backlogs = student.activeBacklogs || 0;
    const backlogsPassed = backlogs <= drive.maxBacklogs;
    criteria.push({
      name: "Maximum Backlogs",
      required: `<= ${drive.maxBacklogs} active backlogs`,
      actual: `${backlogs} active backlogs`,
      passed: backlogsPassed,
    });
    if (!backlogsPassed) {
      failureReasons.push(`You have ${backlogs} active backlogs (maximum permitted: ${drive.maxBacklogs}).`);
    }

    // 3. Department Check
    const deptPassed =
      drive.allowedDepartments.length === 0 ||
      drive.allowedDepartments.some(
        (d) => d.toLowerCase() === student.departmentName.toLowerCase()
      );
    criteria.push({
      name: "Department Eligibility",
      required: drive.allowedDepartments.length === 0 ? "All Departments" : drive.allowedDepartments.join(", "),
      actual: student.departmentName,
      passed: deptPassed,
    });
    if (!deptPassed) {
      failureReasons.push(`Your department (${student.departmentName}) is not eligible for this drive.`);
    }

    // 4. Semester Check
    const semPassed =
      drive.allowedSemesters.length === 0 ||
      drive.allowedSemesters.includes(student.semester);
    criteria.push({
      name: "Semester Eligibility",
      required: drive.allowedSemesters.length === 0 ? "All Semesters" : `Sem ${drive.allowedSemesters.join(", ")}`,
      actual: `Sem ${student.semester}`,
      passed: semPassed,
    });
    if (!semPassed) {
      failureReasons.push(`Semester ${student.semester} students are not eligible for this drive.`);
    }

    // 5. Batch / Graduation Year Check
    if (drive.batchCriteria && student.batchYear) {
      const batchPassed = drive.batchCriteria === student.batchYear;
      criteria.push({
        name: "Graduating Batch",
        required: drive.batchCriteria,
        actual: student.batchYear,
        passed: batchPassed,
      });
      if (!batchPassed) {
        failureReasons.push(`Drive is restricted to batch ${drive.batchCriteria} (your batch: ${student.batchYear}).`);
      }
    }

    const isEligible = failureReasons.length === 0;
    return { isEligible, criteria, failureReasons };
  }

  static async checkStudentEligibility(
    studentUserId: string,
    driveId: string
  ): Promise<EligibilityEvaluation> {
    const drive = DEMO_DRIVES_STORE.find((d) => d.id === driveId);
    if (!drive) throw new Error("Placement drive not found");

    let profileData: StudentProfileForEligibility = {
      cgpa: 8.74,
      departmentName: "Computer Science",
      semester: 6,
      activeBacklogs: 0,
      skills: ["React", "TypeScript", "Node.js", "Python"],
      batchYear: "2026",
    };

    try {
      const { ProfileService } = await import("@/services/profile.service");
      const profile = await ProfileService.getProfile(studentUserId);
      if (profile?.student) {
        profileData = {
          cgpa: profile.student.cgpa || 8.74,
          departmentName: profile.student.department || "Computer Science",
          semester: profile.student.semester || 6,
          activeBacklogs: 0,
          skills: profile.student.skills || ["React", "Node.js"],
          batchYear: profile.student.batchYear || "2026",
        };
      }
    } catch {
      // Fallback to default student data
    }

    return this.checkEligibility(drive, profileData);
  }

  static async getStudentApplicationForDrive(
    studentUserId: string,
    driveId: string
  ): Promise<DemoPlacementApplication | null> {
    const app = DEMO_APPLICATIONS_STORE.find(
      (a) => a.driveId === driveId && a.studentUserId === studentUserId
    );
    return app || null;
  }

  // ==========================================
  // APPLICATIONS & APPLICATION TRACKER
  // ==========================================

  static async applyToDrive(
    driveIdOrOptions:
      | string
      | {
          driveId: string;
          studentUserId: string;
          resumeUrl?: string | null;
          coverNote?: string | null;
          notes?: string | null;
        },
    studentArg?: any,
    resumeUrlArg?: string,
    notesArg?: string
  ): Promise<DemoPlacementApplication> {
    let driveId: string;
    let student: any;
    let resumeUrl: string | undefined;
    let notes: string | undefined;

    if (typeof driveIdOrOptions === "object") {
      driveId = driveIdOrOptions.driveId;
      const studentUserId = driveIdOrOptions.studentUserId;
      resumeUrl = driveIdOrOptions.resumeUrl || undefined;
      notes = driveIdOrOptions.coverNote || driveIdOrOptions.notes || undefined;

      // Resolve student profile
      student = {
        id: `std-${studentUserId}`,
        userId: studentUserId,
        firstName: "Tirth",
        lastName: "Patel",
        email: "student@campussphere.edu",
        rollNumber: "CS-2024-001",
        departmentName: "Computer Science",
        semester: 6,
        cgpa: 8.74,
        activeBacklogs: 0,
        skills: ["React", "TypeScript", "Node.js"],
        batchYear: "2026",
      };

      try {
        const { ProfileService } = await import("@/services/profile.service");
        const profile = await ProfileService.getProfile(studentUserId);
        if (profile) {
          student.firstName = profile.firstName;
          student.lastName = profile.lastName;
          student.email = profile.email;
          if (profile.student) {
            student.id = profile.student.studentId || student.id;
            student.rollNumber = profile.student.rollNumber || student.rollNumber;
            student.departmentName = profile.student.department || student.departmentName;
            student.semester = profile.student.semester || student.semester;
            student.cgpa = profile.student.cgpa || student.cgpa;
            student.skills = profile.student.skills || student.skills;
            student.batchYear = profile.student.batchYear || student.batchYear;
          }
        }
      } catch {
        // Fallback to default student record
      }
    } else {
      driveId = driveIdOrOptions;
      student = studentArg;
      resumeUrl = resumeUrlArg;
      notes = notesArg;
    }

    const drive = DEMO_DRIVES_STORE.find((d) => d.id === driveId);
    if (!drive) throw new Error("Placement drive not found");

    if (drive.status !== PlacementDriveStatus.PUBLISHED) {
      throw new Error("Applications are not currently open for this placement drive");
    }

    // Check application deadline
    if (new Date(drive.applicationDeadline) < new Date()) {
      throw new Error("Application deadline for this drive has already passed");
    }

    // Server-side eligibility enforcement
    const eligibility = this.checkEligibility(drive, student);
    if (!eligibility.isEligible) {
      throw new Error(`Ineligible to apply: ${eligibility.failureReasons.join(" ")}`);
    }

    // Duplicate application check
    const existing = DEMO_APPLICATIONS_STORE.find(
      (a) => a.driveId === driveId && a.studentUserId === student.userId
    );
    if (existing) {
      if (existing.status !== ApplicationStatus.WITHDRAWN) {
        throw new Error("You have already submitted an active application for this placement drive");
      }
    }

    const now = new Date().toISOString();
    const newApp: DemoPlacementApplication = {
      id: `app-${Date.now().toString(36)}`,
      driveId: drive.id,
      driveTitle: drive.title,
      companyName: drive.companyName,
      companyLogo: drive.companyLogo,
      studentId: student.id,
      studentUserId: student.userId,
      studentName: `${student.firstName} ${student.lastName}`.trim(),
      studentEmail: student.email,
      rollNumber: student.rollNumber,
      departmentName: student.departmentName,
      semester: student.semester,
      cgpa: student.cgpa,
      activeBacklogs: student.activeBacklogs || 0,
      resumeUrl: resumeUrl || `https://campussphere.edu/resumes/${student.rollNumber}-resume.pdf`,
      status: ApplicationStatus.APPLIED,
      remarks: notes || "Application submitted via CampusSphere Placement Portal.",
      appliedAt: now,
      updatedAt: now,
      statusHistory: [
        {
          id: `hist-${Date.now().toString(36)}`,
          applicationId: `app-${Date.now().toString(36)}`,
          oldStatus: null,
          newStatus: ApplicationStatus.APPLIED,
          changedBy: student.userId,
          changerName: `${student.firstName} ${student.lastName}`.trim(),
          remarks: notes || "Initial application submitted.",
          createdAt: now,
        },
      ],
    };

    DEMO_APPLICATIONS_STORE.unshift(newApp);

    // Notify Student
    await NotificationService.sendNotification({
      userId: student.userId,
      title: `Application Submitted: ${drive.companyName}`,
      message: `Your application for ${drive.title} was received successfully.`,
      type: NotificationType.PLACEMENT,
      link: `/dashboard/student/placements/applications`,
    });

    // Notify Placement Officer
    await NotificationService.sendNotification({
      userId: "demo-placement-001",
      title: `New Candidate Application: ${drive.companyName}`,
      message: `${newApp.studentName} (${newApp.rollNumber}) applied for ${drive.title}.`,
      type: NotificationType.PLACEMENT,
      link: `/dashboard/placement/drives/${drive.id}`,
    });

    return newApp;
  }

  static async withdrawApplication(
    applicationId: string,
    studentUserId: string
  ): Promise<DemoPlacementApplication> {
    const app = DEMO_APPLICATIONS_STORE.find((a) => a.id === applicationId);
    if (!app) throw new Error("Application not found");

    if (app.studentUserId !== studentUserId) {
      throw new Error("Forbidden: You can only withdraw your own applications");
    }

    if (app.status === ApplicationStatus.OFFERED || app.status === ApplicationStatus.SELECTED) {
      throw new Error("Cannot withdraw application once an offer has been issued. Contact the Placement Cell.");
    }

    const now = new Date().toISOString();
    const oldStatus = app.status;
    app.status = ApplicationStatus.WITHDRAWN;
    app.updatedAt = now;
    app.statusHistory.unshift({
      id: `hist-${Date.now().toString(36)}`,
      applicationId: app.id,
      oldStatus,
      newStatus: ApplicationStatus.WITHDRAWN,
      changedBy: studentUserId,
      changerName: app.studentName,
      remarks: "Candidate voluntarily withdrew application.",
      createdAt: now,
    });

    return app;
  }

  static async getApplications(options: {
    driveId?: string;
    studentUserId?: string;
    status?: ApplicationStatus;
    search?: string;
    userRole?: Role | string;
  }): Promise<any[]> {
    const { driveId, studentUserId, status, search } = options;
    let list = [...DEMO_APPLICATIONS_STORE];

    if (driveId) {
      list = list.filter((a) => a.driveId === driveId);
    }
    if (studentUserId) {
      list = list.filter((a) => a.studentUserId === studentUserId);
    }
    if (status) {
      list = list.filter((a) => a.status === status);
    }
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.studentName.toLowerCase().includes(q) ||
          a.rollNumber.toLowerCase().includes(q) ||
          a.companyName.toLowerCase().includes(q) ||
          a.driveTitle.toLowerCase().includes(q)
      );
    }

    return list.map((a) => ({
      ...a,
      student: {
        id: a.studentId,
        userId: a.studentUserId,
        name: a.studentName,
        email: a.studentEmail,
        rollNumber: a.rollNumber,
        departmentName: a.departmentName,
        cgpa: a.cgpa,
      },
    }));
  }

  static async getApplicationById(
    id: string,
    userId?: string,
    role: Role | string = Role.ADMIN
  ): Promise<any | null> {
    const app = DEMO_APPLICATIONS_STORE.find((a) => a.id === id);
    if (!app) return null;

    // Authorization: Student can only view their own; Officer/Admin can view all
    if (userId && role === Role.STUDENT && app.studentUserId !== userId) {
      throw new Error("Forbidden: You cannot access application records belonging to other students");
    }

    return {
      ...app,
      student: {
        id: app.studentId,
        userId: app.studentUserId,
        name: app.studentName,
        email: app.studentEmail,
        rollNumber: app.rollNumber,
        departmentName: app.departmentName,
        cgpa: app.cgpa,
      },
    };
  }

  static async updateApplicationStatus(
    applicationIdOrOptions:
      | string
      | {
          applicationId: string;
          newStatus: ApplicationStatus;
          remarks?: string;
          officerUserId: string;
          officerRole?: Role | string;
          officerName?: string;
        },
    newStatusArg?: ApplicationStatus,
    officerUserIdArg?: string,
    officerRoleArg: Role | string = Role.PLACEMENT_OFFICER,
    officerNameArg = "Placement Cell Officer",
    remarksArg?: string
  ): Promise<DemoPlacementApplication> {
    let applicationId: string;
    let newStatus: ApplicationStatus;
    let officerUserId: string;
    let officerRole: Role | string;
    let officerName: string;
    let remarks: string | undefined;

    if (typeof applicationIdOrOptions === "object") {
      applicationId = applicationIdOrOptions.applicationId;
      newStatus = applicationIdOrOptions.newStatus;
      officerUserId = applicationIdOrOptions.officerUserId;
      officerRole = applicationIdOrOptions.officerRole || Role.PLACEMENT_OFFICER;
      officerName = applicationIdOrOptions.officerName || "Placement Cell Officer";
      remarks = applicationIdOrOptions.remarks;
    } else {
      applicationId = applicationIdOrOptions;
      newStatus = newStatusArg!;
      officerUserId = officerUserIdArg!;
      officerRole = officerRoleArg;
      officerName = officerNameArg;
      remarks = remarksArg;
    }

    if (officerRole !== Role.PLACEMENT_OFFICER && officerRole !== Role.ADMIN) {
      throw new Error("Forbidden: Only placement officers and administrators can update candidate application status");
    }

    const app = DEMO_APPLICATIONS_STORE.find((a) => a.id === applicationId);
    if (!app) throw new Error("Application not found");

    const oldStatus = app.status;
    const now = new Date().toISOString();

    app.status = newStatus;
    if (remarks) app.remarks = remarks;
    app.updatedAt = now;

    const historyRecord: DemoApplicationStatusHistory = {
      id: `hist-${Date.now().toString(36)}`,
      applicationId: app.id,
      oldStatus,
      newStatus,
      changedBy: officerUserId,
      changerName: officerName,
      remarks: remarks || `Status updated to ${newStatus}`,
      createdAt: now,
    };
    app.statusHistory.unshift(historyRecord);

    // Audit log
    await this.recordAuditLog({
      action: "UPDATE_APPLICATION_STATUS",
      entity: "PlacementApplication",
      entityId: app.id,
      userId: officerUserId,
      details: { student: app.studentName, drive: app.driveTitle, oldStatus, newStatus },
    });

    // Notify Student
    let message = `Your application for ${app.driveTitle} at ${app.companyName} is now: ${newStatus}.`;
    if (newStatus === ApplicationStatus.SHORTLISTED) {
      message = `Congratulations! You have been shortlisted for ${app.driveTitle} at ${app.companyName}.`;
    } else if (newStatus === ApplicationStatus.OFFERED || newStatus === ApplicationStatus.SELECTED) {
      message = `Outstanding news! You have received a placement offer from ${app.companyName}!`;
    }

    await NotificationService.sendNotification({
      userId: app.studentUserId,
      title: `Application Status Updated: ${app.companyName}`,
      message,
      type: NotificationType.PLACEMENT,
      link: `/dashboard/student/placements/applications`,
    });

    return app;
  }

  // ==========================================
  // PLACEMENT OFFICER ANALYTICS
  // ==========================================

  static async getPlacementAnalytics(
    officerUserId = "demo-placement-001",
    role: Role | string = Role.PLACEMENT_OFFICER
  ): Promise<any> {
    if (role !== Role.PLACEMENT_OFFICER && role !== Role.ADMIN) {
      throw new Error("Forbidden: You do not have permission to access placement analytics");
    }

    const totalDrives = DEMO_DRIVES_STORE.length;
    const activeDrives = DEMO_DRIVES_STORE.filter(
      (d) => d.status === PlacementDriveStatus.PUBLISHED || d.status === PlacementDriveStatus.IN_PROGRESS
    ).length;

    const totalApplications = DEMO_APPLICATIONS_STORE.length;
    const shortlistedCount = DEMO_APPLICATIONS_STORE.filter((a) => a.status === ApplicationStatus.SHORTLISTED).length;
    const interviewCount = DEMO_APPLICATIONS_STORE.filter((a) => a.status === ApplicationStatus.INTERVIEW).length;
    const offeredCount = DEMO_APPLICATIONS_STORE.filter(
      (a) => a.status === ApplicationStatus.OFFERED || a.status === ApplicationStatus.SELECTED
    ).length;

    // Average package calculation
    const publishedDrives = DEMO_DRIVES_STORE.filter((d) => d.status !== PlacementDriveStatus.DRAFT);
    const avgPackage =
      publishedDrives.length > 0
        ? publishedDrives.reduce((acc, d) => acc + (d.packageMin + d.packageMax) / 2, 0) / publishedDrives.length
        : 0;

    const conversionRate = totalApplications > 0 ? (offeredCount / totalApplications) * 100 : 0;

    return {
      totalDrives,
      activeDrives,
      totalPartners: DEMO_COMPANIES_STORE.length,
      totalApplications,
      shortlistedCount,
      interviewCount,
      offeredCount,
      averagePackageLPA: Number(avgPackage.toFixed(2)),
      conversionRate: Number(conversionRate.toFixed(1)),
      stageBreakdown: {
        applied: DEMO_APPLICATIONS_STORE.filter((a) => a.status === ApplicationStatus.APPLIED).length,
        shortlisted: shortlistedCount,
        interview: interviewCount,
        offered: offeredCount,
        rejected: DEMO_APPLICATIONS_STORE.filter((a) => a.status === ApplicationStatus.REJECTED).length,
        withdrawn: DEMO_APPLICATIONS_STORE.filter((a) => a.status === ApplicationStatus.WITHDRAWN).length,
      },
    };
  }

  // ==========================================
  // HELPERS
  // ==========================================

  private static slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private static async recordAuditLog({
    action,
    entity,
    entityId,
    userId,
    details,
  }: {
    action: string;
    entity: string;
    entityId?: string;
    userId?: string;
    details?: any;
  }): Promise<void> {
    try {
      if (await isDatabaseOnline()) {
        await prisma.auditLog.create({
          data: {
            action,
            entity,
            entityId,
            userId,
            details: details || {},
          },
        });
      }
    } catch {
      // In-memory non-blocking audit fallback
    }
  }
}
