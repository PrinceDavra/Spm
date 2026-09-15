import { prisma } from "@/lib/prisma";
import { isDatabaseOnline } from "@/lib/db-health";
import { ExamType, ExamStatus, RevaluationStatus, Role } from "@prisma/client";
import {
  DemoExam,
  DemoExamEnrollment,
  DemoGradebookEntry,
  DemoExamResult,
  DemoRevaluationRequest,
  StudentAcademicTranscript,
  TranscriptSemesterRecord,
  DEMO_EXAMS_STORE,
  DEMO_EXAM_ENROLLMENTS_STORE,
  DEMO_GRADEBOOK_STORE,
  DEMO_EXAM_RESULTS_STORE,
  DEMO_REVALUATION_STORE,
  DEMO_HISTORICAL_TRANSCRIPTS,
  calculateGrade,
  getDegreeClassification,
} from "@/lib/exam/demo-exams";
import {
  DEMO_DEPARTMENTS,
  DEMO_PROGRAMS,
  DEMO_SUBJECTS,
  DEMO_ROOMS,
  DEMO_DIVISIONS,
} from "@/lib/admin/demo-academic";
import { DEMO_USERS } from "@/lib/auth/demo-users";
import { DEMO_ENROLLED_STUDENTS } from "@/lib/attendance/demo-attendance";
import { NotificationService } from "@/services/notification.service";
import { NotificationPriority, NotificationType } from "@prisma/client";
import {
  CreateExamInput,
  UpdateExamInput,
  ScheduleExamInput,
  GradebookEntryInput,
  RevaluationRequestInput,
  ReviewRevaluationInput,
  ExamFilterInput,
} from "@/validators/exam.schema";

export class ExamService {
  /**
   * Internal audit logger.
   */
  private static async logAudit(
    userId: string,
    action: string,
    entity: string,
    entityId: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    try {
      if (await isDatabaseOnline()) {
        await prisma.auditLog.create({
          data: {
            userId,
            action,
            entity,
            entityId,
            details: details ? JSON.stringify(details) : undefined,
          },
        });
      }
    } catch {
      // Non-blocking fallback
    }
  }

  // =========================================================================
  // 1. CONFLICT CHECKING & SCHEDULING ENGINE
  // =========================================================================

  /**
   * Checks for scheduling conflicts across rooms, faculty, divisions, and time intervals.
   */
  static checkSchedulingConflicts(params: {
    examId?: string;
    date: string;
    startTime: string;
    endTime: string;
    roomId?: string | null;
    facultyId?: string | null;
    divisionId?: string | null;
    examType?: ExamType;
  }): { hasConflict: boolean; errors: string[] } {
    const errors: string[] = [];
    const [startH, startM] = params.startTime.split(":").map(Number);
    const [endH, endM] = params.endTime.split(":").map(Number);
    const reqStartMin = startH * 60 + startM;
    const reqEndMin = endH * 60 + endM;

    if (reqEndMin <= reqStartMin) {
      errors.push("End time must be strictly after start time.");
    }
    if (reqEndMin - reqStartMin < 30) {
      errors.push("Exam duration must be at least 30 minutes.");
    }

    // Check practical exam lab requirement
    if (params.examType === ExamType.PRACTICAL && params.roomId) {
      const room = DEMO_ROOMS.find((r) => r.id === params.roomId);
      if (room && room.type !== "LAB") {
        errors.push(`Practical exams require a laboratory facility. Room '${room.roomNumber}' is a '${room.type}'.`);
      }
    }

    // Check active scheduled or ongoing exams on the same date
    const sameDayExams = DEMO_EXAMS_STORE.filter(
      (e) =>
        e.id !== params.examId &&
        e.date === params.date &&
        (e.status === ExamStatus.SCHEDULED || e.status === ExamStatus.ONGOING)
    );

    for (const exam of sameDayExams) {
      const [eStartH, eStartM] = exam.startTime.split(":").map(Number);
      const [eEndH, eEndM] = exam.endTime.split(":").map(Number);
      const eStartMin = eStartH * 60 + eStartM;
      const eEndMin = eEndH * 60 + eEndM;

      // Overlap condition: max(startA, startB) < min(endA, endB)
      const isOverlap = Math.max(reqStartMin, eStartMin) < Math.min(reqEndMin, eEndMin);

      if (isOverlap) {
        // Room conflict
        if (params.roomId && exam.roomId === params.roomId) {
          errors.push(`Room collision: Room '${exam.roomNumber || exam.roomId}' is already booked for '${exam.title}' (${exam.startTime} - ${exam.endTime}).`);
        }

        // Faculty clash
        if (params.facultyId && exam.facultyId === params.facultyId) {
          errors.push(`Faculty conflict: Invigilator '${exam.facultyName || exam.facultyId}' is already assigned to '${exam.title}' (${exam.startTime} - ${exam.endTime}).`);
        }

        // Division conflict
        if (params.divisionId && exam.divisionId === params.divisionId) {
          errors.push(`Division conflict: Division has another exam scheduled: '${exam.title}' (${exam.startTime} - ${exam.endTime}).`);
        }
      }
    }

    return {
      hasConflict: errors.length > 0,
      errors,
    };
  }

  // =========================================================================
  // 2. EXAM CRUD & LIFECYCLE MANAGEMENT
  // =========================================================================

  /**
   * List exams with multi-parameter filtering and role-based scoping.
   */
  static async getExams(filters?: ExamFilterInput, userId?: string, role?: Role): Promise<DemoExam[]> {
    let list = [...DEMO_EXAMS_STORE];

    // Role-based visibility
    if (role === Role.STUDENT) {
      // Students can only discover scheduled, ongoing, completed, published, or locked exams
      list = list.filter((e) => e.status !== ExamStatus.DRAFT && e.status !== ExamStatus.ARCHIVED);
    } else if (role === Role.FACULTY && userId) {
      const faculty = DEMO_USERS.find((u) => u.id === userId || u.facultyId === userId);
      // If faculty, filter by facultyId or allow all if viewing department exams
      if (filters?.facultyId) {
        list = list.filter((e) => e.facultyId === filters.facultyId || e.facultyId === faculty?.id);
      }
    }

    if (filters?.departmentId) {
      list = list.filter((e) => e.departmentId === filters.departmentId);
    }
    if (filters?.semesterNumber) {
      list = list.filter((e) => e.semesterNumber === filters.semesterNumber);
    }
    if (filters?.divisionId) {
      list = list.filter((e) => e.divisionId === filters.divisionId);
    }
    if (filters?.subjectId) {
      list = list.filter((e) => e.subjectId === filters.subjectId || e.subjectCode === filters.subjectId);
    }
    if (filters?.status) {
      list = list.filter((e) => e.status === filters.status);
    }
    if (filters?.examType) {
      list = list.filter((e) => e.examType === filters.examType);
    }
    if (filters?.academicYear) {
      list = list.filter((e) => e.academicYear === filters.academicYear);
    }
    if (filters?.date) {
      list = list.filter((e) => e.date === filters.date);
    }

    return list.sort((a, b) => b.date.localeCompare(a.date));
  }

  /**
   * Get single exam details with enrollment counts and gradebook progress.
   */
  static async getExamById(id: string, userId?: string, role?: Role) {
    const exam = DEMO_EXAMS_STORE.find((e) => e.id === id);
    if (!exam) return null;

    // Student privacy: students cannot view draft or archived exams
    if (role === Role.STUDENT && (exam.status === ExamStatus.DRAFT || exam.status === ExamStatus.ARCHIVED)) {
      return null;
    }

    const enrollments = DEMO_EXAM_ENROLLMENTS_STORE.filter((enr) => enr.examId === exam.id);
    const gradebookEntries = DEMO_GRADEBOOK_STORE.filter((gb) => gb.examId === exam.id);
    const gradedCount = gradebookEntries.filter((gb) => gb.marksObtained !== null || gb.isAbsent).length;

    return {
      ...exam,
      totalEnrolled: enrollments.length,
      gradedCount,
      isGradingComplete: enrollments.length > 0 && gradedCount >= enrollments.length,
      enrollments: role === Role.STUDENT ? enrollments.filter((enr) => enr.studentId === userId) : enrollments,
    };
  }

  /**
   * Create an exam draft.
   */
  static async createExam(input: CreateExamInput, adminUserId: string): Promise<DemoExam> {
    const subject = DEMO_SUBJECTS.find((s) => s.id === input.subjectId || s.code === input.subjectId);
    if (!subject) {
      throw new Error(`Subject '${input.subjectId}' does not exist.`);
    }

    const room = input.roomId ? DEMO_ROOMS.find((r) => r.id === input.roomId) : null;
    const faculty = input.facultyId ? DEMO_USERS.find((u) => u.id === input.facultyId) : null;

    // If scheduling parameters provided, perform conflict check
    if (input.roomId || input.facultyId || input.divisionId) {
      const conflictResult = this.checkSchedulingConflicts({
        date: input.date,
        startTime: input.startTime,
        endTime: input.endTime,
        roomId: input.roomId,
        facultyId: input.facultyId,
        divisionId: input.divisionId,
        examType: input.examType,
      });

      if (conflictResult.hasConflict) {
        throw new Error(conflictResult.errors.join(" | "));
      }
    }

    const newExam: DemoExam = {
      id: `exam-${Date.now()}`,
      title: input.title.trim(),
      examType: input.examType,
      academicYear: input.academicYear,
      semesterNumber: input.semesterNumber,
      departmentId: input.departmentId,
      programId: input.programId ?? null,
      batchId: input.batchId ?? null,
      divisionId: input.divisionId ?? null,
      subjectId: subject.id,
      subjectCode: subject.code,
      subjectName: subject.name,
      credits: subject.credits || 3,
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      roomId: input.roomId ?? null,
      roomNumber: room ? room.roomNumber : null,
      facultyId: input.facultyId ?? null,
      facultyName: faculty ? `${faculty.firstName} ${faculty.lastName}` : null,
      maxMarks: input.maxMarks,
      passingMarks: input.passingMarks,
      instructions: input.instructions ?? null,
      status: input.roomId && input.facultyId ? ExamStatus.SCHEDULED : ExamStatus.DRAFT,
      createdBy: adminUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    DEMO_EXAMS_STORE.unshift(newExam);

    // Auto-enroll eligible students from the division or semester cohort
    for (const student of DEMO_ENROLLED_STUDENTS) {
      DEMO_EXAM_ENROLLMENTS_STORE.push({
        id: `enr-${Date.now()}-${student.id.slice(-4)}`,
        examId: newExam.id,
        studentId: student.id,
        studentName: student.name,
        rollNumber: student.rollNumber,
        prnNumber: `PRN2022${student.id.slice(-6)}`,
        isEligible: true,
        hallTicketNumber: `HT-2025-${newExam.id.slice(-3)}${student.rollNumber.slice(-3)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    await this.logAudit(adminUserId, "EXAM_CREATED", "Exam", newExam.id, {
      title: newExam.title,
      examType: newExam.examType,
      status: newExam.status,
    });

    return newExam;
  }

  /**
   * Schedule an existing exam with conflict validation.
   */
  static async scheduleExam(id: string, input: ScheduleExamInput, adminUserId: string): Promise<DemoExam> {
    const examIndex = DEMO_EXAMS_STORE.findIndex((e) => e.id === id);
    if (examIndex === -1) {
      throw new Error("Exam not found");
    }

    const exam = DEMO_EXAMS_STORE[examIndex];
    if (exam.status === ExamStatus.LOCKED || exam.status === ExamStatus.ARCHIVED) {
      throw new Error(`Cannot schedule an exam with status '${exam.status}'.`);
    }

    // Perform conflict check
    const conflictResult = this.checkSchedulingConflicts({
      examId: exam.id,
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      roomId: input.roomId,
      facultyId: input.facultyId,
      divisionId: input.divisionId ?? exam.divisionId,
      examType: exam.examType,
    });

    if (conflictResult.hasConflict) {
      throw new Error(conflictResult.errors.join(" | "));
    }

    const room = DEMO_ROOMS.find((r) => r.id === input.roomId);
    const faculty = DEMO_USERS.find((u) => u.id === input.facultyId);

    const updatedExam: DemoExam = {
      ...exam,
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      roomId: input.roomId,
      roomNumber: room ? room.roomNumber : exam.roomNumber,
      facultyId: input.facultyId,
      facultyName: faculty ? `${faculty.firstName} ${faculty.lastName}` : exam.facultyName,
      divisionId: input.divisionId ?? exam.divisionId,
      status: ExamStatus.SCHEDULED,
      updatedAt: new Date().toISOString(),
    };

    DEMO_EXAMS_STORE[examIndex] = updatedExam;

    // Dispatch notifications to enrolled students
    const enrollments = DEMO_EXAM_ENROLLMENTS_STORE.filter((enr) => enr.examId === exam.id);
    for (const enr of enrollments) {
      await NotificationService.sendNotification({
        userId: enr.studentId,
        title: `Exam Scheduled: ${updatedExam.title}`,
        message: `Your exam '${updatedExam.subjectName}' is scheduled on ${updatedExam.date} from ${updatedExam.startTime} to ${updatedExam.endTime} in ${updatedExam.roomNumber || "assigned hall"}.`,
        type: NotificationType.ACADEMIC,
        priority: NotificationPriority.HIGH,
        link: "/dashboard/results",
        sourceEntity: "Exam",
        sourceId: updatedExam.id,
        action: "EXAM_SCHEDULED",
      });
    }

    await this.logAudit(adminUserId, "EXAM_SCHEDULED", "Exam", updatedExam.id, {
      date: updatedExam.date,
      room: updatedExam.roomNumber,
      faculty: updatedExam.facultyName,
    });

    return updatedExam;
  }

  /**
   * Update an exam.
   */
  static async updateExam(id: string, input: UpdateExamInput, adminUserId: string): Promise<DemoExam> {
    const examIndex = DEMO_EXAMS_STORE.findIndex((e) => e.id === id);
    if (examIndex === -1) {
      throw new Error("Exam not found");
    }

    const exam = DEMO_EXAMS_STORE[examIndex];
    if (exam.status === ExamStatus.LOCKED || exam.status === ExamStatus.ARCHIVED) {
      throw new Error(`Cannot update an exam with status '${exam.status}'.`);
    }

    const updated: DemoExam = {
      ...exam,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    DEMO_EXAMS_STORE[examIndex] = updated;

    await this.logAudit(adminUserId, "EXAM_UPDATED", "Exam", updated.id, { changes: input });
    return updated;
  }

  /**
   * Publish exam results.
   */
  static async publishResults(id: string, adminUserId: string): Promise<DemoExam> {
    const examIndex = DEMO_EXAMS_STORE.findIndex((e) => e.id === id);
    if (examIndex === -1) {
      throw new Error("Exam not found");
    }

    const exam = DEMO_EXAMS_STORE[examIndex];
    const gradebookEntries = DEMO_GRADEBOOK_STORE.filter((gb) => gb.examId === exam.id);

    if (gradebookEntries.length === 0) {
      throw new Error("Cannot publish results: No grades have been recorded in the gradebook.");
    }

    const updatedExam: DemoExam = {
      ...exam,
      status: ExamStatus.PUBLISHED,
      updatedAt: new Date().toISOString(),
    };

    DEMO_EXAMS_STORE[examIndex] = updatedExam;

    // Create or update semester result record for each student
    const enrollments = DEMO_EXAM_ENROLLMENTS_STORE.filter((enr) => enr.examId === exam.id);
    for (const enr of enrollments) {
      const studentGrade = gradebookEntries.find((gb) => gb.studentId === enr.studentId);
      if (studentGrade) {
        // Find existing result or create new
        const existingResultIndex = DEMO_EXAM_RESULTS_STORE.findIndex(
          (r) => r.studentId === enr.studentId && r.semesterNumber === exam.semesterNumber
        );

        const newSubjectGrade = {
          subjectId: exam.subjectId,
          subjectCode: exam.subjectCode,
          subjectName: exam.subjectName,
          credits: exam.credits,
          maxMarks: exam.maxMarks,
          marksObtained: studentGrade.marksObtained ?? 0,
          percentage: studentGrade.marksObtained ? Math.round((studentGrade.marksObtained / exam.maxMarks) * 1000) / 10 : 0,
          gradeLetter: studentGrade.gradeLetter ?? "F",
          gradePoint: studentGrade.gradePoint ?? 0,
          isPassed: studentGrade.isPassed,
          isAbsent: studentGrade.isAbsent,
        };

        if (existingResultIndex !== -1) {
          const res = DEMO_EXAM_RESULTS_STORE[existingResultIndex];
          const updatedSubjectGrades = res.subjectGrades.filter((s) => s.subjectId !== exam.subjectId);
          updatedSubjectGrades.push(newSubjectGrade);

          // Calculate new semester GPA
          let totalCreditPoints = 0;
          let totalCredits = 0;
          let earnedCredits = 0;
          updatedSubjectGrades.forEach((sg) => {
            totalCreditPoints += sg.credits * sg.gradePoint;
            totalCredits += sg.credits;
            if (sg.isPassed) earnedCredits += sg.credits;
          });

          const gpa = totalCredits > 0 ? Math.round((totalCreditPoints / totalCredits) * 100) / 100 : 0;

          DEMO_EXAM_RESULTS_STORE[existingResultIndex] = {
            ...res,
            gpa,
            totalCreditsAttempted: totalCredits,
            totalCreditsEarned: earnedCredits,
            subjectGrades: updatedSubjectGrades,
            status: "PUBLISHED",
            publishedAt: new Date().toISOString(),
            publishedBy: adminUserId,
            updatedAt: new Date().toISOString(),
          };
        } else {
          DEMO_EXAM_RESULTS_STORE.push({
            id: `res-${Date.now()}-${enr.studentId.slice(-4)}`,
            studentId: enr.studentId,
            studentName: enr.studentName,
            rollNumber: enr.rollNumber,
            prnNumber: enr.prnNumber,
            academicYear: exam.academicYear,
            semesterNumber: exam.semesterNumber,
            examTitle: exam.title,
            gpa: studentGrade.gradePoint ?? 0,
            totalCreditsAttempted: exam.credits,
            totalCreditsEarned: studentGrade.isPassed ? exam.credits : 0,
            status: "PUBLISHED",
            publishedAt: new Date().toISOString(),
            publishedBy: adminUserId,
            subjectGrades: [newSubjectGrade],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }

        // Send high-priority notification to student
        await NotificationService.sendNotification({
          userId: enr.studentId,
          title: `Result Published: ${exam.title}`,
          message: `Official results for '${exam.subjectName}' are now published. Your grade: ${studentGrade.gradeLetter} (${studentGrade.marksObtained}/${exam.maxMarks}).`,
          type: NotificationType.ACADEMIC,
          priority: NotificationPriority.HIGH,
          link: "/dashboard/results",
          sourceEntity: "ExamResult",
          sourceId: exam.id,
          action: "RESULT_PUBLISHED",
        });
      }
    }

    await this.logAudit(adminUserId, "RESULTS_PUBLISHED", "Exam", exam.id, {
      examTitle: exam.title,
      totalGradesPublished: gradebookEntries.length,
    });

    return updatedExam;
  }

  /**
   * Lock results against casual modification.
   */
  static async lockResults(id: string, adminUserId: string): Promise<DemoExam> {
    const examIndex = DEMO_EXAMS_STORE.findIndex((e) => e.id === id);
    if (examIndex === -1) {
      throw new Error("Exam not found");
    }

    const exam = DEMO_EXAMS_STORE[examIndex];
    if (exam.status !== ExamStatus.PUBLISHED) {
      throw new Error(`Only published exams can be locked. Current status is '${exam.status}'.`);
    }

    const updatedExam: DemoExam = {
      ...exam,
      status: ExamStatus.LOCKED,
      updatedAt: new Date().toISOString(),
    };

    DEMO_EXAMS_STORE[examIndex] = updatedExam;

    // Lock corresponding result objects
    DEMO_EXAM_RESULTS_STORE.forEach((r, idx) => {
      if (r.semesterNumber === exam.semesterNumber) {
        DEMO_EXAM_RESULTS_STORE[idx].status = "LOCKED";
        DEMO_EXAM_RESULTS_STORE[idx].lockedAt = new Date().toISOString();
        DEMO_EXAM_RESULTS_STORE[idx].lockedBy = adminUserId;
      }
    });

    await this.logAudit(adminUserId, "RESULTS_LOCKED", "Exam", exam.id, {
      title: exam.title,
    });

    return updatedExam;
  }

  // =========================================================================
  // 3. GRADEBOOK OPERATIONS
  // =========================================================================

  /**
   * Get gradebook for an exam with authorization check.
   */
  static async getExamGradebook(examId: string, callerUserId: string, role: Role) {
    const exam = DEMO_EXAMS_STORE.find((e) => e.id === examId);
    if (!exam) {
      throw new Error("Exam not found");
    }

    if (role === Role.STUDENT) {
      throw new Error("Students are not authorized to view the class gradebook.");
    }

    if (role === Role.FACULTY) {
      const faculty = DEMO_USERS.find((u) => u.id === callerUserId || u.facultyId === callerUserId);
      if (exam.facultyId && exam.facultyId !== callerUserId && exam.facultyId !== faculty?.id) {
        throw new Error("You are not authorized to grade this exam.");
      }
    }

    const enrollments = DEMO_EXAM_ENROLLMENTS_STORE.filter((enr) => enr.examId === examId);
    const entries = DEMO_GRADEBOOK_STORE.filter((gb) => gb.examId === examId);

    const gradebookRows = enrollments.map((enr) => {
      const entry = entries.find((gb) => gb.studentId === enr.studentId);
      return {
        enrollmentId: enr.id,
        studentId: enr.studentId,
        studentName: enr.studentName,
        rollNumber: enr.rollNumber,
        isEligible: enr.isEligible,
        hallTicketNumber: enr.hallTicketNumber,
        marksObtained: entry ? entry.marksObtained : null,
        isAbsent: entry ? entry.isAbsent : false,
        gradeLetter: entry ? entry.gradeLetter : null,
        gradePoint: entry ? entry.gradePoint : null,
        isPassed: entry ? entry.isPassed : false,
        remarks: entry ? entry.remarks : null,
        gradedAt: entry ? entry.gradedAt : null,
      };
    });

    const gradedCount = gradebookRows.filter((r) => r.marksObtained !== null || r.isAbsent).length;

    return {
      exam,
      entries: gradebookRows,
      stats: {
        totalEnrolled: enrollments.length,
        gradedCount,
        pendingCount: enrollments.length - gradedCount,
        completionPercentage: enrollments.length > 0 ? Math.round((gradedCount / enrollments.length) * 100) : 0,
      },
    };
  }

  /**
   * Save or bulk-save gradebook entries.
   */
  static async saveGradebookEntries(
    examId: string,
    entries: GradebookEntryInput[],
    callerUserId: string,
    role: Role
  ) {
    const exam = DEMO_EXAMS_STORE.find((e) => e.id === examId);
    if (!exam) {
      throw new Error("Exam not found");
    }

    if (role === Role.STUDENT) {
      throw new Error("Students cannot enter grades.");
    }

    if (role === Role.FACULTY) {
      const faculty = DEMO_USERS.find((u) => u.id === callerUserId || u.facultyId === callerUserId);
      if (exam.facultyId && exam.facultyId !== callerUserId && exam.facultyId !== faculty?.id) {
        throw new Error("You are not authorized to grade this exam.");
      }
    }

    if (exam.status === ExamStatus.LOCKED || exam.status === ExamStatus.ARCHIVED) {
      throw new Error(`Cannot modify grades: Exam is in '${exam.status}' state.`);
    }

    const savedList: DemoGradebookEntry[] = [];

    for (const input of entries) {
      if (input.marksObtained !== null && input.marksObtained !== undefined) {
        if (input.marksObtained < 0) {
          throw new Error(`Marks cannot be negative. Got: ${input.marksObtained}`);
        }
        if (input.marksObtained > exam.maxMarks) {
          throw new Error(`Marks (${input.marksObtained}) cannot exceed maximum marks (${exam.maxMarks}).`);
        }
      }

      const calculated = calculateGrade(
        input.isAbsent ? 0 : input.marksObtained ?? 0,
        exam.maxMarks,
        input.isAbsent
      );

      const existingIndex = DEMO_GRADEBOOK_STORE.findIndex(
        (gb) => gb.examId === examId && gb.studentId === input.studentId
      );

      const enrollment = DEMO_EXAM_ENROLLMENTS_STORE.find(
        (enr) => enr.examId === examId && enr.studentId === input.studentId
      );

      const gradeEntry: DemoGradebookEntry = {
        id: existingIndex !== -1 ? DEMO_GRADEBOOK_STORE[existingIndex].id : `gb-${Date.now()}-${input.studentId.slice(-4)}`,
        examId,
        studentId: input.studentId,
        studentName: enrollment ? enrollment.studentName : "Enrolled Student",
        rollNumber: enrollment ? enrollment.rollNumber : "N/A",
        marksObtained: input.isAbsent ? 0 : input.marksObtained ?? null,
        isAbsent: input.isAbsent,
        gradeLetter: calculated.gradeLetter,
        gradePoint: calculated.gradePoint,
        isPassed: calculated.isPassed,
        remarks: input.remarks ?? null,
        gradedBy: callerUserId,
        gradedAt: new Date().toISOString(),
        createdAt: existingIndex !== -1 ? DEMO_GRADEBOOK_STORE[existingIndex].createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (existingIndex !== -1) {
        DEMO_GRADEBOOK_STORE[existingIndex] = gradeEntry;
      } else {
        DEMO_GRADEBOOK_STORE.push(gradeEntry);
      }

      savedList.push(gradeEntry);
    }

    // Update exam status to RESULTS_PENDING if currently SCHEDULED/ONGOING
    if (exam.status === ExamStatus.SCHEDULED || exam.status === ExamStatus.ONGOING) {
      exam.status = ExamStatus.RESULTS_PENDING;
      exam.updatedAt = new Date().toISOString();
    }

    await this.logAudit(callerUserId, "GRADEBOOK_UPDATED", "Exam", examId, {
      entriesCount: entries.length,
    });

    return {
      success: true,
      savedCount: savedList.length,
      entries: savedList,
    };
  }

  // =========================================================================
  // 4. STUDENT RESULTS & GPA / CGPA ENGINE
  // =========================================================================

  /**
   * Get student results across published exams and semesters.
   */
  static async getStudentResults(studentUserId: string, semester?: number) {
    const student = DEMO_USERS.find((u) => u.id === studentUserId);

    let results = DEMO_EXAM_RESULTS_STORE.filter(
      (r) => r.studentId === studentUserId || r.studentId === student?.studentId
    );

    if (semester) {
      results = results.filter((r) => r.semesterNumber === semester);
    }

    // Historical semesters from transcripts
    const historical = DEMO_HISTORICAL_TRANSCRIPTS[studentUserId] || DEMO_HISTORICAL_TRANSCRIPTS["demo-student-001"] || [];

    // Calculate Cumulative CGPA across all published semesters
    let totalCredits = 0;
    let totalPoints = 0;

    historical.forEach((sem) => {
      totalCredits += sem.creditsAttempted;
      totalPoints += sem.creditsAttempted * sem.gpa;
    });

    results.forEach((res) => {
      totalCredits += res.totalCreditsAttempted;
      totalPoints += res.totalCreditsAttempted * res.gpa;
    });

    const cumulativeCgpa = totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : 8.91;

    return {
      student: {
        id: studentUserId,
        name: student ? `${student.firstName} ${student.lastName}` : "Aarav Mehta",
        rollNumber: student?.rollNumber || "22COMPA101",
        prnNumber: student?.prnNumber || "PRN2022014589",
        currentSemester: student?.semester || 6,
        department: student?.departmentName || "Computer Engineering",
      },
      cumulativeCgpa,
      degreeClassification: getDegreeClassification(cumulativeCgpa),
      publishedResults: results,
      historicalSemesters: historical,
    };
  }

  /**
   * Generate official academic transcript data.
   */
  static async getAcademicTranscript(studentUserId: string): Promise<StudentAcademicTranscript> {
    const student = DEMO_USERS.find((u) => u.id === studentUserId);
    const studentName = student ? `${student.firstName} ${student.lastName}` : "Aarav Mehta";
    const rollNumber = student?.rollNumber || "22COMPA101";
    const prnNumber = student?.prnNumber || "PRN2022014589";

    const historical = DEMO_HISTORICAL_TRANSCRIPTS[studentUserId] || DEMO_HISTORICAL_TRANSCRIPTS["demo-student-001"] || [];
    const currentResults = DEMO_EXAM_RESULTS_STORE.filter(
      (r) => r.studentId === studentUserId || r.studentId === student?.studentId
    );

    const allSemesters: TranscriptSemesterRecord[] = [...historical];

    // Append published current semester
    currentResults.forEach((cr) => {
      if (!allSemesters.some((s) => s.semesterNumber === cr.semesterNumber)) {
        allSemesters.push({
          semesterNumber: cr.semesterNumber,
          academicYear: cr.academicYear,
          term: "EVEN",
          gpa: cr.gpa,
          creditsAttempted: cr.totalCreditsAttempted,
          creditsEarned: cr.totalCreditsEarned,
          subjects: cr.subjectGrades,
        });
      }
    });

    // Sort chronologically by semester number
    allSemesters.sort((a, b) => a.semesterNumber - b.semesterNumber);

    let totalAttempted = 0;
    let totalEarned = 0;
    let sumCreditGpa = 0;

    allSemesters.forEach((sem) => {
      totalAttempted += sem.creditsAttempted;
      totalEarned += sem.creditsEarned;
      sumCreditGpa += sem.creditsAttempted * sem.gpa;
    });

    const cumulativeCgpa = totalAttempted > 0 ? Math.round((sumCreditGpa / totalAttempted) * 100) / 100 : 8.91;

    return {
      student: {
        id: studentUserId,
        userId: studentUserId,
        name: studentName,
        rollNumber,
        prnNumber,
        department: student?.departmentName || "Computer Engineering",
        program: "Bachelor of Technology in Computer Engineering",
        batch: "2022-2026",
        currentSemester: student?.semester || 6,
      },
      semesters: allSemesters,
      summary: {
        totalCreditsAttempted: totalAttempted,
        totalCreditsEarned: totalEarned,
        cumulativeCgpa,
        degreeClassification: getDegreeClassification(cumulativeCgpa),
        academicStatus: "IN_PROGRESS",
        issuedDate: new Date().toISOString().split("T")[0],
        referenceNumber: `CS-TRANS-2025-${rollNumber}`,
      },
    };
  }

  // =========================================================================
  // 5. REVALUATION WORKFLOW
  // =========================================================================

  /**
   * Submit a revaluation or grade correction request.
   */
  static async submitRevaluationRequest(studentUserId: string, input: RevaluationRequestInput) {
    const exam = DEMO_EXAMS_STORE.find((e) => e.id === input.examId);
    if (!exam) {
      throw new Error("Exam not found");
    }

    if (exam.status !== ExamStatus.PUBLISHED && exam.status !== ExamStatus.LOCKED) {
      throw new Error("Cannot request revaluation for an unpublished exam.");
    }

    const student = DEMO_USERS.find((u) => u.id === studentUserId);
    const existingReq = DEMO_REVALUATION_STORE.find(
      (r) => r.examId === input.examId && r.studentId === studentUserId && r.status === RevaluationStatus.PENDING
    );

    if (existingReq) {
      throw new Error("A pending revaluation request already exists for this exam.");
    }

    const gradeEntry = DEMO_GRADEBOOK_STORE.find(
      (gb) => gb.examId === input.examId && gb.studentId === studentUserId
    );

    const currentMarks = gradeEntry?.marksObtained ?? 0;

    const newRequest: DemoRevaluationRequest = {
      id: `rev-${Date.now()}`,
      examId: input.examId,
      examTitle: exam.title,
      studentId: studentUserId,
      studentName: student ? `${student.firstName} ${student.lastName}` : "Student",
      rollNumber: student?.rollNumber || "N/A",
      subjectId: exam.subjectId,
      subjectCode: exam.subjectCode,
      subjectName: exam.subjectName,
      reason: input.reason.trim(),
      currentMarks,
      requestedMarks: input.requestedMarks ?? null,
      reviewedMarks: null,
      status: RevaluationStatus.PENDING,
      reviewerRemarks: null,
      reviewedBy: null,
      reviewedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    DEMO_REVALUATION_STORE.unshift(newRequest);

    await this.logAudit(studentUserId, "REVALUATION_REQUESTED", "RevaluationRequest", newRequest.id, {
      examId: exam.id,
      subject: exam.subjectCode,
      currentMarks,
    });

    return newRequest;
  }

  /**
   * List revaluation requests.
   */
  static async getRevaluationRequests(filters?: { status?: RevaluationStatus; examId?: string }, userId?: string, role?: Role) {
    let list = [...DEMO_REVALUATION_STORE];

    if (role === Role.STUDENT && userId) {
      list = list.filter((r) => r.studentId === userId);
    }
    if (filters?.status) {
      list = list.filter((r) => r.status === filters.status);
    }
    if (filters?.examId) {
      list = list.filter((r) => r.examId === filters.examId);
    }

    return list;
  }

  /**
   * Review a revaluation request (Admin or authorized Faculty).
   */
  static async reviewRevaluationRequest(
    requestId: string,
    input: ReviewRevaluationInput,
    reviewerUserId: string,
    role: Role
  ) {
    const reqIndex = DEMO_REVALUATION_STORE.findIndex((r) => r.id === requestId);
    if (reqIndex === -1) {
      throw new Error("Revaluation request not found");
    }

    const req = DEMO_REVALUATION_STORE[reqIndex];

    // Self-review prevention
    if (req.studentId === reviewerUserId) {
      throw new Error("You cannot review your own revaluation request.");
    }

    if (role !== Role.ADMIN && role !== Role.FACULTY) {
      throw new Error("Unauthorized to review revaluation requests.");
    }

    const exam = DEMO_EXAMS_STORE.find((e) => e.id === req.examId);
    if (!exam) {
      throw new Error("Associated exam not found");
    }

    if (input.status === RevaluationStatus.APPROVED && input.reviewedMarks !== undefined && input.reviewedMarks !== null) {
      if (input.reviewedMarks > exam.maxMarks) {
        throw new Error(`Reviewed marks (${input.reviewedMarks}) cannot exceed maximum marks (${exam.maxMarks}).`);
      }

      // Update authoritative Gradebook Entry
      const gbIndex = DEMO_GRADEBOOK_STORE.findIndex(
        (gb) => gb.examId === req.examId && gb.studentId === req.studentId
      );

      if (gbIndex !== -1) {
        const calculated = calculateGrade(input.reviewedMarks, exam.maxMarks);
        DEMO_GRADEBOOK_STORE[gbIndex] = {
          ...DEMO_GRADEBOOK_STORE[gbIndex],
          marksObtained: input.reviewedMarks,
          gradeLetter: calculated.gradeLetter,
          gradePoint: calculated.gradePoint,
          isPassed: calculated.isPassed,
          remarks: `Marks updated via revaluation by ${reviewerUserId}. Remarks: ${input.reviewerRemarks}`,
          updatedAt: new Date().toISOString(),
        };

        // Update ExamResult record
        const resIndex = DEMO_EXAM_RESULTS_STORE.findIndex(
          (r) => r.studentId === req.studentId && r.semesterNumber === exam.semesterNumber
        );
        if (resIndex !== -1) {
          const res = DEMO_EXAM_RESULTS_STORE[resIndex];
          const updatedSubjectGrades = res.subjectGrades.map((sg) => {
            if (sg.subjectId === exam.subjectId) {
              return {
                ...sg,
                marksObtained: input.reviewedMarks!,
                percentage: Math.round((input.reviewedMarks! / exam.maxMarks) * 1000) / 10,
                gradeLetter: calculated.gradeLetter,
                gradePoint: calculated.gradePoint,
                isPassed: calculated.isPassed,
              };
            }
            return sg;
          });

          // Recalculate GPA
          let sumPoints = 0;
          let sumCredits = 0;
          updatedSubjectGrades.forEach((sg) => {
            sumPoints += sg.credits * sg.gradePoint;
            sumCredits += sg.credits;
          });
          const newGpa = sumCredits > 0 ? Math.round((sumPoints / sumCredits) * 100) / 100 : res.gpa;

          DEMO_EXAM_RESULTS_STORE[resIndex] = {
            ...res,
            gpa: newGpa,
            subjectGrades: updatedSubjectGrades,
            updatedAt: new Date().toISOString(),
          };
        }
      }

      // Send approval notification
      await NotificationService.sendNotification({
        userId: req.studentId,
        title: `Revaluation Approved: ${req.subjectCode}`,
        message: `Your revaluation request for '${req.subjectName}' has been approved. Revised marks: ${input.reviewedMarks}/${exam.maxMarks}.`,
        type: NotificationType.ACADEMIC,
        priority: NotificationPriority.HIGH,
        link: "/dashboard/results",
        sourceEntity: "RevaluationRequest",
        sourceId: req.id,
        action: "REVALUATION_APPROVED",
      });
    } else if (input.status === RevaluationStatus.REJECTED) {
      await NotificationService.sendNotification({
        userId: req.studentId,
        title: `Revaluation Decision: ${req.subjectCode}`,
        message: `Your revaluation request for '${req.subjectName}' was reviewed and retained. Remarks: ${input.reviewerRemarks}`,
        type: NotificationType.ACADEMIC,
        priority: NotificationPriority.NORMAL,
        link: "/dashboard/results",
        sourceEntity: "RevaluationRequest",
        sourceId: req.id,
        action: "REVALUATION_REJECTED",
      });
    }

    const updatedRequest: DemoRevaluationRequest = {
      ...req,
      status: input.status,
      reviewedMarks: input.reviewedMarks ?? req.currentMarks,
      reviewerRemarks: input.reviewerRemarks,
      reviewedBy: reviewerUserId,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    DEMO_REVALUATION_STORE[reqIndex] = updatedRequest;

    await this.logAudit(reviewerUserId, "REVALUATION_REVIEWED", "RevaluationRequest", updatedRequest.id, {
      status: input.status,
      oldMarks: req.currentMarks,
      newMarks: input.reviewedMarks,
    });

    return updatedRequest;
  }

  // =========================================================================
  // 6. EXAM & RESULTS ANALYTICS
  // =========================================================================

  /**
   * Aggregate statistics for exam performance.
   */
  static async getExamAnalytics() {
    const totalExams = DEMO_EXAMS_STORE.length;
    const scheduledExams = DEMO_EXAMS_STORE.filter((e) => e.status === ExamStatus.SCHEDULED).length;
    const completedExams = DEMO_EXAMS_STORE.filter(
      (e) => e.status === ExamStatus.COMPLETED || e.status === ExamStatus.RESULTS_PENDING
    ).length;
    const publishedExams = DEMO_EXAMS_STORE.filter((e) => e.status === ExamStatus.PUBLISHED).length;
    const lockedExams = DEMO_EXAMS_STORE.filter((e) => e.status === ExamStatus.LOCKED).length;

    const allGrades = DEMO_GRADEBOOK_STORE;
    const evaluatedGrades = allGrades.filter((g) => g.marksObtained !== null || g.isAbsent);

    const absentCount = evaluatedGrades.filter((g) => g.isAbsent).length;
    const passedCount = evaluatedGrades.filter((g) => g.isPassed && !g.isAbsent).length;
    const failedCount = evaluatedGrades.filter((g) => !g.isPassed || g.isAbsent).length;

    const evaluatedTotal = evaluatedGrades.length || 1;
    const passRate = Math.round((passedCount / evaluatedTotal) * 100);
    const failRate = Math.round((failedCount / evaluatedTotal) * 100);
    const absentRate = Math.round((absentCount / evaluatedTotal) * 100);

    // Grade brackets
    const gradeDistribution: Record<string, number> = {
      gradeAPlus: evaluatedGrades.filter((g) => g.gradeLetter === "A+").length,
      gradeA: evaluatedGrades.filter((g) => g.gradeLetter === "A").length,
      gradeBPlus: evaluatedGrades.filter((g) => g.gradeLetter === "B+").length,
      gradeB: evaluatedGrades.filter((g) => g.gradeLetter === "B").length,
      gradeC: evaluatedGrades.filter((g) => g.gradeLetter === "C").length,
      gradeD: evaluatedGrades.filter((g) => g.gradeLetter === "D").length,
      gradeF: evaluatedGrades.filter((g) => g.gradeLetter === "F").length,
      "A+": evaluatedGrades.filter((g) => g.gradeLetter === "A+").length,
      A: evaluatedGrades.filter((g) => g.gradeLetter === "A").length,
      "B+": evaluatedGrades.filter((g) => g.gradeLetter === "B+").length,
      B: evaluatedGrades.filter((g) => g.gradeLetter === "B").length,
      C: evaluatedGrades.filter((g) => g.gradeLetter === "C").length,
      D: evaluatedGrades.filter((g) => g.gradeLetter === "D").length,
      F: evaluatedGrades.filter((g) => g.gradeLetter === "F").length,
    };

    // Subject averages across exams
    const subjectMap: Record<string, { code: string; name: string; sumPct: number; count: number }> = {};
    evaluatedGrades.forEach((g) => {
      const exam = DEMO_EXAMS_STORE.find((e) => e.id === g.examId);
      if (exam && g.marksObtained !== null) {
        const pct = (g.marksObtained / exam.maxMarks) * 100;
        if (!subjectMap[exam.subjectCode]) {
          subjectMap[exam.subjectCode] = { code: exam.subjectCode, name: exam.subjectName, sumPct: 0, count: 0 };
        }
        subjectMap[exam.subjectCode].sumPct += pct;
        subjectMap[exam.subjectCode].count++;
      }
    });

    const subjectPerformance = Object.values(subjectMap).map((s) => ({
      subjectCode: s.code,
      subjectName: s.name,
      averagePercentage: s.count > 0 ? Math.round((s.sumPct / s.count) * 10) / 10 : 80.0,
      studentsEvaluated: s.count,
    }));

    return {
      totalExams,
      scheduledExams,
      completedExams,
      publishedExams,
      lockedExams,
      evaluatedGradesCount: evaluatedGrades.length,
      passRate,
      failRate,
      absentRate,
      gradeDistribution,
      subjectPerformance,
    };
  }
}
