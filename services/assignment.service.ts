import { prisma } from "@/lib/prisma";
import { isDatabaseOnline } from "@/lib/db-health";
import {
  DEMO_ASSIGNMENTS_DB,
  DEMO_SUBMISSIONS_DB,
  DemoAssignment,
  DemoSubmission,
  DemoAttachment,
} from "@/lib/assignment/demo-assignments";
import { DEMO_FACULTY_SUBJECTS, DEMO_ENROLLED_STUDENTS } from "@/lib/attendance/demo-attendance";
import { DEMO_USERS } from "@/lib/auth/demo-users";
import { NotificationService } from "@/services/notification.service";
import {
  CreateAssignmentInput,
  UpdateAssignmentInput,
  SubmitAssignmentInput,
  GradeSubmissionInput,
} from "@/validators/assignment.schema";
import { AssignmentStatus, SubmissionStatus, Role, NotificationType } from "@prisma/client";

export interface StudentAssignmentListItem extends DemoAssignment {
  submissionStatus: "NOT_SUBMITTED" | "SUBMITTED" | "LATE" | "GRADED" | "OVERDUE";
  submission?: DemoSubmission;
  urgencyText: string;
  isUrgent: boolean;
  isOverdue: boolean;
}

export interface StudentAssignmentSummary {
  kpi: {
    dueSoon: number;
    pending: number;
    submitted: number;
    overdue: number;
  };
  assignments: StudentAssignmentListItem[];
}

export interface FacultyAssignmentSummaryItem extends DemoAssignment {
  totalEnrolled: number;
  submittedCount: number;
  pendingGradingCount: number;
  gradedCount: number;
  lateCount: number;
  submissionRate: number; // percentage
  averageMarks: number | null;
}

export interface SubmissionRosterItem {
  studentId: string;
  studentName: string;
  rollNumber: string;
  submissionStatus: "NOT_SUBMITTED" | "SUBMITTED" | "LATE" | "GRADED";
  submissionId?: string;
  submittedAt?: string;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  submissionText?: string;
  comments?: string;
  isLate: boolean;
  latePenaltyApplied: number;
  marksObtained?: number | null;
  feedback?: string | null;
  gradedAt?: string | null;
}

// Dangerous executable file extensions disallowed under all circumstances
const BLOCKED_EXTENSIONS = ["exe", "bat", "cmd", "sh", "vbs", "js", "mjs", "dll", "bin", "app", "jar"];

export class AssignmentService {
  /**
   * Helper to compute dynamic urgency label and status based on real server time
   */
  private static calculateUrgency(dueDateIso: string): { urgencyText: string; isUrgent: boolean; isOverdue: boolean } {
    const now = Date.now();
    const dueTime = new Date(dueDateIso).getTime();
    const diffMs = dueTime - now;

    if (diffMs <= 0) {
      const hoursAgo = Math.floor(Math.abs(diffMs) / (3600 * 1000));
      const daysAgo = Math.floor(hoursAgo / 24);
      return {
        urgencyText: daysAgo > 0 ? `Deadline passed ${daysAgo}d ago` : `Deadline passed ${hoursAgo || 1}h ago`,
        isUrgent: false,
        isOverdue: true,
      };
    }

    const diffHours = Math.floor(diffMs / (3600 * 1000));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 24) {
      return {
        urgencyText: `Due in ${diffHours === 0 ? "< 1" : diffHours} hour${diffHours === 1 ? "" : "s"}`,
        isUrgent: true,
        isOverdue: false,
      };
    }

    if (diffDays === 1) {
      return {
        urgencyText: "Due tomorrow",
        isUrgent: true,
        isOverdue: false,
      };
    }

    return {
      urgencyText: `Due in ${diffDays} days`,
      isUrgent: false,
      isOverdue: false,
    };
  }

  /**
   * Validate that an uploaded filename does not contain path traversal or dangerous executable extensions
   */
  static validateUploadedFile(fileName: string, allowedExtensions: string[], maxSizeBytes: number, actualSizeBytes?: number): void {
    if (!fileName || fileName.trim().length === 0) {
      throw new Error("File name is missing.");
    }

    // Path traversal check
    if (fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
      throw new Error("Security Violation: Illegal file name containing path traversal characters.");
    }

    const parts = fileName.split(".");
    if (parts.length < 2) {
      throw new Error("File must have a valid extension.");
    }

    const ext = parts[parts.length - 1].toLowerCase();

    if (BLOCKED_EXTENSIONS.includes(ext)) {
      throw new Error(`Security Violation: Executable and script file extensions (.${ext}) are strictly prohibited.`);
    }

    const normalizedAllowed = allowedExtensions.map((e) => e.toLowerCase().replace(/^\./, ""));
    if (normalizedAllowed.length > 0 && !normalizedAllowed.includes(ext)) {
      throw new Error(`Invalid file type (.${ext}). Allowed types: ${normalizedAllowed.join(", ")}.`);
    }

    if (actualSizeBytes && actualSizeBytes > maxSizeBytes) {
      const maxMb = (maxSizeBytes / (1024 * 1024)).toFixed(1);
      throw new Error(`File size exceeds maximum permitted limit of ${maxMb}MB.`);
    }
  }

  /**
   * Faculty / Admin: Create a new assignment
   */
  static async createAssignment(
    userId: string,
    userRole: Role,
    data: CreateAssignmentInput
  ): Promise<DemoAssignment> {
    // 1. Check faculty subject mapping
    const mapping = DEMO_FACULTY_SUBJECTS.find(
      (fs) => fs.id === data.subjectId && fs.divisionId === data.divisionId
    );

    if (!mapping) {
      throw new Error("Selected subject and division combination is not found in academic records.");
    }

    if (userRole === Role.FACULTY && mapping.facultyId !== userId) {
      throw new Error("Security Violation: Faculty is not authorized to create assignments for an unassigned subject/division.");
    }

    // 2. Validate due date
    const dueDate = new Date(data.dueDate);
    if (isNaN(dueDate.getTime())) {
      throw new Error("Invalid due date specified.");
    }

    const now = new Date();
    if (dueDate.getTime() <= now.getTime()) {
      throw new Error("Assignment due date must be set in the future.");
    }

    // 3. Format attachments
    const assignmentId = `asgn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const attachments: DemoAttachment[] = (data.attachments || []).map((att, idx) => ({
      id: `att-${assignmentId}-${idx + 1}`,
      assignmentId,
      fileName: att.fileName,
      fileUrl: att.fileUrl,
      fileType: att.fileType || "application/pdf",
      fileSize: att.fileSize,
      uploadedAt: now.toISOString(),
    }));

    const newAssignment: DemoAssignment = {
      id: assignmentId,
      facultySubjectId: mapping.facultySubjectId,
      subjectId: mapping.id,
      subjectCode: mapping.code,
      subjectName: mapping.name,
      facultyId: mapping.facultyId,
      facultyName: mapping.facultyName,
      divisionId: mapping.divisionId,
      divisionName: mapping.divisionName,
      semester: mapping.semester,
      title: data.title,
      description: data.description,
      instructions: data.instructions || "",
      maxMarks: data.maxMarks ?? 100,
      dueDate: dueDate.toISOString(),
      publishDate: now.toISOString(),
      status: data.status || AssignmentStatus.PUBLISHED,
      allowLateSubmission: data.allowLateSubmission ?? true,
      latePenalty: data.latePenalty ?? 10,
      maxFileSize: data.maxFileSize ?? 10485760,
      allowedFileTypes: data.allowedFileTypes || ["pdf", "docx", "zip", "txt"],
      attachments,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    DEMO_ASSIGNMENTS_DB.unshift(newAssignment);

    // 4. If published, notify students in division
    if (newAssignment.status === AssignmentStatus.PUBLISHED) {
      const studentUserIds = DEMO_ENROLLED_STUDENTS.map((s) => s.id);
      await NotificationService.sendBulkNotification({
        userIds: studentUserIds,
        title: `New Assignment Published: ${newAssignment.title}`,
        message: `${mapping.name} assignment has been published. Due on ${new Date(newAssignment.dueDate).toLocaleDateString()}.`,
        type: NotificationType.ASSIGNMENT,
        link: `/dashboard/student/assignments/${newAssignment.id}`,
      });
    }

    // 5. Audit Log
    try {
      if (await isDatabaseOnline()) {
        await prisma.auditLog.create({
          data: {
            userId,
            action: "CREATE_ASSIGNMENT",
            entity: "Assignment",
            entityId: newAssignment.id,
            details: {
              title: newAssignment.title,
              subjectCode: newAssignment.subjectCode,
              divisionId: newAssignment.divisionId,
              status: newAssignment.status,
            },
          },
        });
      }
    } catch {
      // Offline fallback
    }

    return newAssignment;
  }

  /**
   * Faculty / Admin: Update an assignment
   */
  static async updateAssignment(
    userId: string,
    userRole: Role,
    assignmentId: string,
    data: UpdateAssignmentInput
  ): Promise<DemoAssignment> {
    const index = DEMO_ASSIGNMENTS_DB.findIndex((a) => a.id === assignmentId);
    if (index === -1) {
      throw new Error("Assignment not found.");
    }

    const current = DEMO_ASSIGNMENTS_DB[index];

    if (userRole === Role.FACULTY && current.facultyId !== userId) {
      throw new Error("Security Violation: You cannot edit an assignment created by another faculty member.");
    }

    if (current.status === AssignmentStatus.CLOSED) {
      throw new Error("Cannot modify an assignment that is already closed.");
    }

    // Check if grading exists
    const hasGradedSubmissions = DEMO_SUBMISSIONS_DB.some(
      (s) => s.assignmentId === assignmentId && s.status === SubmissionStatus.GRADED
    );
    if (hasGradedSubmissions && data.maxMarks && data.maxMarks !== current.maxMarks) {
      throw new Error("Cannot change total marks after submissions have been graded.");
    }

    const updated: DemoAssignment = {
      ...current,
      title: data.title ?? current.title,
      description: data.description ?? current.description,
      instructions: data.instructions ?? current.instructions,
      maxMarks: data.maxMarks ?? current.maxMarks,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : current.dueDate,
      status: data.status ?? current.status,
      allowLateSubmission: data.allowLateSubmission ?? current.allowLateSubmission,
      latePenalty: data.latePenalty ?? current.latePenalty,
      maxFileSize: data.maxFileSize ?? current.maxFileSize,
      allowedFileTypes: data.allowedFileTypes ?? current.allowedFileTypes,
      updatedAt: new Date().toISOString(),
    };

    DEMO_ASSIGNMENTS_DB[index] = updated;
    return updated;
  }

  /**
   * Faculty / Admin: Publish a draft assignment
   */
  static async publishAssignment(
    userId: string,
    userRole: Role,
    assignmentId: string
  ): Promise<DemoAssignment> {
    const assignment = await this.updateAssignment(userId, userRole, assignmentId, {
      status: AssignmentStatus.PUBLISHED,
    });

    const studentUserIds = DEMO_ENROLLED_STUDENTS.map((s) => s.id);
    await NotificationService.sendBulkNotification({
      userIds: studentUserIds,
      title: `Assignment Published: ${assignment.title}`,
      message: `${assignment.subjectName} assignment is now open for submission.`,
      type: NotificationType.ASSIGNMENT,
      link: `/dashboard/student/assignments/${assignment.id}`,
    });

    return assignment;
  }

  /**
   * Faculty / Admin: Close an assignment
   */
  static async closeAssignment(
    userId: string,
    userRole: Role,
    assignmentId: string
  ): Promise<DemoAssignment> {
    return this.updateAssignment(userId, userRole, assignmentId, {
      status: AssignmentStatus.CLOSED,
    });
  }

  /**
   * Student: Get enrolled assignments with submission state and KPI summary
   */
  static async getStudentAssignments(
    studentUserId: string,
    filters?: { subjectId?: string; status?: string; search?: string }
  ): Promise<StudentAssignmentSummary> {
    // Demo student is in Division A
    const enrolledDivisionId = "div-comp-a";

    // Filter published or closed assignments for this division (students NEVER see DRAFT)
    let assignments = DEMO_ASSIGNMENTS_DB.filter(
      (a) => a.divisionId === enrolledDivisionId && a.status !== AssignmentStatus.DRAFT
    );

    if (filters?.subjectId && filters.subjectId !== "ALL") {
      assignments = assignments.filter((a) => a.subjectId === filters.subjectId);
    }

    if (filters?.search && filters.search.trim().length > 0) {
      const q = filters.search.toLowerCase();
      assignments = assignments.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.subjectName.toLowerCase().includes(q) ||
          a.subjectCode.toLowerCase().includes(q) ||
          a.facultyName.toLowerCase().includes(q)
      );
    }

    const listItems: StudentAssignmentListItem[] = assignments.map((assignment) => {
      const submission = DEMO_SUBMISSIONS_DB.find(
        (s) => s.assignmentId === assignment.id && s.studentId === studentUserId
      );

      const urgency = this.calculateUrgency(assignment.dueDate);

      let submissionStatus: StudentAssignmentListItem["submissionStatus"] = "NOT_SUBMITTED";

      if (submission) {
        if (submission.status === SubmissionStatus.GRADED) {
          submissionStatus = "GRADED";
        } else if (submission.isLate) {
          submissionStatus = "LATE";
        } else {
          submissionStatus = "SUBMITTED";
        }
      } else if (urgency.isOverdue) {
        submissionStatus = "OVERDUE";
      } else {
        submissionStatus = "NOT_SUBMITTED";
      }

      return {
        ...assignment,
        submissionStatus,
        submission,
        urgencyText: urgency.urgencyText,
        isUrgent: urgency.isUrgent,
        isOverdue: urgency.isOverdue,
      };
    });

    // Apply status filter if provided
    let filteredItems = listItems;
    if (filters?.status && filters.status !== "ALL") {
      filteredItems = listItems.filter((item) => {
        if (filters.status === "PENDING") return item.submissionStatus === "NOT_SUBMITTED";
        return item.submissionStatus === filters.status;
      });
    }

    // Compute KPI metrics across all student's assignments
    const dueSoonCount = listItems.filter((i) => i.submissionStatus === "NOT_SUBMITTED" && i.isUrgent).length;
    const pendingCount = listItems.filter((i) => i.submissionStatus === "NOT_SUBMITTED" && !i.isOverdue).length;
    const submittedCount = listItems.filter((i) => i.submissionStatus === "SUBMITTED" || i.submissionStatus === "LATE" || i.submissionStatus === "GRADED").length;
    const overdueCount = listItems.filter((i) => i.submissionStatus === "OVERDUE").length;

    return {
      kpi: {
        dueSoon: dueSoonCount,
        pending: pendingCount,
        submitted: submittedCount,
        overdue: overdueCount,
      },
      assignments: filteredItems,
    };
  }

  /**
   * Get single assignment details with access boundaries
   */
  static async getAssignmentDetails(
    userId: string,
    userRole: Role,
    assignmentId: string
  ): Promise<{
    assignment: DemoAssignment;
    submission?: DemoSubmission;
    urgencyText: string;
    isUrgent: boolean;
    isOverdue: boolean;
    canSubmit: boolean;
    canGrade: boolean;
  }> {
    const assignment = DEMO_ASSIGNMENTS_DB.find((a) => a.id === assignmentId);
    if (!assignment) {
      throw new Error("Assignment not found.");
    }

    // Access control
    if (userRole === Role.STUDENT) {
      if (assignment.status === AssignmentStatus.DRAFT) {
        throw new Error("Security Violation: Draft assignments are not accessible to students.");
      }
      if (assignment.divisionId !== "div-comp-a") {
        throw new Error("Security Violation: You are not enrolled in the class/division for this assignment.");
      }
    } else if (userRole === Role.FACULTY) {
      if (assignment.facultyId !== userId) {
        // Only authoring/mapped faculty or admin can access
        throw new Error("Security Violation: You are not assigned to teach or manage this assignment.");
      }
    }

    const urgency = this.calculateUrgency(assignment.dueDate);
    const submission = DEMO_SUBMISSIONS_DB.find(
      (s) => s.assignmentId === assignmentId && s.studentId === userId
    );

    const isClosed = assignment.status === AssignmentStatus.CLOSED;
    const deadlinePassed = urgency.isOverdue;
    const canSubmit =
      userRole === Role.STUDENT &&
      !isClosed &&
      (!deadlinePassed || assignment.allowLateSubmission);

    const canGrade = userRole === Role.ADMIN || (userRole === Role.FACULTY && assignment.facultyId === userId);

    return {
      assignment,
      submission,
      urgencyText: urgency.urgencyText,
      isUrgent: urgency.isUrgent,
      isOverdue: urgency.isOverdue,
      canSubmit,
      canGrade,
    };
  }

  /**
   * Student: Submit or resubmit an assignment
   */
  static async submitAssignment(
    studentUserId: string,
    assignmentId: string,
    data: SubmitAssignmentInput
  ): Promise<DemoSubmission> {
    const assignment = DEMO_ASSIGNMENTS_DB.find((a) => a.id === assignmentId);
    if (!assignment) {
      throw new Error("Assignment not found.");
    }

    if (assignment.status === AssignmentStatus.DRAFT) {
      throw new Error("Cannot submit to an unpublished assignment.");
    }

    if (assignment.status === AssignmentStatus.CLOSED) {
      throw new Error("Submissions are closed for this assignment.");
    }

    // Check if an existing submission has already been evaluated
    const existingIndex = DEMO_SUBMISSIONS_DB.findIndex(
      (s) => s.assignmentId === assignmentId && s.studentId === studentUserId
    );
    if (existingIndex !== -1 && DEMO_SUBMISSIONS_DB[existingIndex].status === SubmissionStatus.GRADED) {
      throw new Error("This submission has already been graded and cannot be resubmitted.");
    }

    // 1. Deadline verification using authoritative server time
    const now = Date.now();
    const dueTime = new Date(assignment.dueDate).getTime();
    const isLate = now > dueTime;

    let latePenaltyApplied = 0;
    if (isLate) {
      if (!assignment.allowLateSubmission) {
        throw new Error("Deadline has passed. Late submissions are not permitted for this assignment.");
      }
      latePenaltyApplied = assignment.latePenalty;
    }

    // 2. File security validation if file is present
    if (data.fileName) {
      this.validateUploadedFile(
        data.fileName,
        assignment.allowedFileTypes,
        assignment.maxFileSize,
        data.fileSize
      );
    }

    // 3. Resolve student identity
    const studentUser = DEMO_USERS.find((u) => u.id === studentUserId);
    const studentName = studentUser ? `${studentUser.firstName} ${studentUser.lastName}` : "Aarav Mehta";
    const rollNumber = studentUser?.rollNumber || "22COMPA101";

    // 4. Handle Resubmission vs New Submission
    let savedSubmission: DemoSubmission;

    if (existingIndex !== -1) {
      const existing = DEMO_SUBMISSIONS_DB[existingIndex];
      if (existing.status === SubmissionStatus.GRADED) {
        throw new Error("This submission has already been graded and cannot be resubmitted.");
      }

      savedSubmission = {
        ...existing,
        fileUrl: data.fileUrl || existing.fileUrl,
        fileName: data.fileName || existing.fileName,
        fileSize: data.fileSize || existing.fileSize,
        fileType: data.fileType || existing.fileType,
        submissionText: data.submissionText ?? existing.submissionText,
        comments: data.comments ?? existing.comments,
        submittedAt: new Date(now).toISOString(),
        isLate,
        latePenaltyApplied,
        version: existing.version + 1,
        status: isLate ? SubmissionStatus.LATE : SubmissionStatus.SUBMITTED,
      };

      DEMO_SUBMISSIONS_DB[existingIndex] = savedSubmission;
    } else {
      savedSubmission = {
        id: `sub-${assignmentId}-${Date.now()}`,
        assignmentId,
        studentId: studentUserId,
        studentName,
        rollNumber,
        submittedAt: new Date(now).toISOString(),
        fileUrl: data.fileUrl || `/uploads/submissions/${studentUserId}_${data.fileName || "submission.pdf"}`,
        fileName: data.fileName || "online_submission.pdf",
        fileSize: data.fileSize || 102400,
        fileType: data.fileType || "application/pdf",
        submissionText: data.submissionText || "",
        comments: data.comments || "",
        marksObtained: null,
        feedback: null,
        isLate,
        latePenaltyApplied,
        version: 1,
        status: isLate ? SubmissionStatus.LATE : SubmissionStatus.SUBMITTED,
      };

      DEMO_SUBMISSIONS_DB.push(savedSubmission);
    }

    // 5. Send notification to student confirming submission
    await NotificationService.sendNotification({
      userId: studentUserId,
      title: `Assignment Submitted: ${assignment.title}`,
      message: `Your submission (v${savedSubmission.version}) was recorded on ${new Date(savedSubmission.submittedAt).toLocaleTimeString()}.${isLate ? ` Note: Marked as LATE with a ${latePenaltyApplied}% penalty applied.` : ""}`,
      type: NotificationType.ASSIGNMENT,
      link: `/dashboard/student/assignments/${assignment.id}`,
    });

    // 6. Audit Log
    try {
      if (await isDatabaseOnline()) {
        await prisma.auditLog.create({
          data: {
            userId: studentUserId,
            action: "SUBMIT_ASSIGNMENT",
            entity: "AssignmentSubmission",
            entityId: savedSubmission.id,
            details: {
              assignmentId,
              version: savedSubmission.version,
              isLate,
              latePenaltyApplied,
            },
          },
        });
      }
    } catch {
      // Offline fallback
    }

    return savedSubmission;
  }

  /**
   * Faculty / Admin: List assignments with live submission metrics
   */
  static async getFacultyAssignments(
    facultyUserId: string,
    userRole: Role
  ): Promise<FacultyAssignmentSummaryItem[]> {
    let assignments = DEMO_ASSIGNMENTS_DB;

    if (userRole === Role.FACULTY) {
      assignments = assignments.filter((a) => a.facultyId === facultyUserId);
    }

    return assignments.map((assignment) => {
      const submissions = DEMO_SUBMISSIONS_DB.filter((s) => s.assignmentId === assignment.id);
      const totalEnrolled = DEMO_ENROLLED_STUDENTS.length; // 5 enrolled students in division
      const submittedCount = submissions.length;
      const gradedCount = submissions.filter((s) => s.status === SubmissionStatus.GRADED).length;
      const pendingGradingCount = submittedCount - gradedCount;
      const lateCount = submissions.filter((s) => s.isLate).length;
      const submissionRate = Math.round((submittedCount / totalEnrolled) * 100);

      const gradedMarks = submissions
        .filter((s) => typeof s.marksObtained === "number")
        .map((s) => s.marksObtained as number);

      const averageMarks =
        gradedMarks.length > 0
          ? Math.round((gradedMarks.reduce((a, b) => a + b, 0) / gradedMarks.length) * 10) / 10
          : null;

      return {
        ...assignment,
        totalEnrolled,
        submittedCount,
        pendingGradingCount,
        gradedCount,
        lateCount,
        submissionRate,
        averageMarks,
      };
    });
  }

  /**
   * Faculty / Admin: Get full student submission roster for an assignment
   */
  static async getAssignmentSubmissions(
    userId: string,
    userRole: Role,
    assignmentId: string,
    filterStatus?: string,
    search?: string
  ): Promise<{
    assignment: DemoAssignment;
    roster: SubmissionRosterItem[];
  }> {
    const assignment = DEMO_ASSIGNMENTS_DB.find((a) => a.id === assignmentId);
    if (!assignment) {
      throw new Error("Assignment not found.");
    }

    if (userRole === Role.FACULTY && assignment.facultyId !== userId) {
      throw new Error("Security Violation: You are not authorized to view submissions for this assignment.");
    }

    const submissions = DEMO_SUBMISSIONS_DB.filter((s) => s.assignmentId === assignmentId);

    // Build roster combining enrolled students and their submission records
    let roster: SubmissionRosterItem[] = DEMO_ENROLLED_STUDENTS.map((student) => {
      const sub = submissions.find((s) => s.studentId === student.id);

      if (sub) {
        return {
          studentId: student.id,
          studentName: student.name,
          rollNumber: student.rollNumber,
          submissionStatus: sub.status === SubmissionStatus.GRADED ? "GRADED" : sub.isLate ? "LATE" : "SUBMITTED",
          submissionId: sub.id,
          submittedAt: sub.submittedAt,
          fileName: sub.fileName,
          fileUrl: sub.fileUrl,
          fileSize: sub.fileSize,
          submissionText: sub.submissionText,
          comments: sub.comments,
          isLate: sub.isLate,
          latePenaltyApplied: sub.latePenaltyApplied,
          marksObtained: sub.marksObtained,
          feedback: sub.feedback,
          gradedAt: sub.gradedAt,
        };
      }

      return {
        studentId: student.id,
        studentName: student.name,
        rollNumber: student.rollNumber,
        submissionStatus: "NOT_SUBMITTED",
        isLate: false,
        latePenaltyApplied: 0,
      };
    });

    if (search && search.trim().length > 0) {
      const q = search.toLowerCase();
      roster = roster.filter(
        (r) => r.studentName.toLowerCase().includes(q) || r.rollNumber.toLowerCase().includes(q)
      );
    }

    if (filterStatus && filterStatus !== "ALL") {
      roster = roster.filter((r) => r.submissionStatus === filterStatus);
    }

    return {
      assignment,
      roster,
    };
  }

  /**
   * Faculty / Admin: Grade a submission and provide feedback
   */
  static async gradeSubmission(
    facultyUserId: string,
    userRole: Role,
    submissionId: string,
    data: GradeSubmissionInput
  ): Promise<DemoSubmission> {
    const submissionIndex = DEMO_SUBMISSIONS_DB.findIndex((s) => s.id === submissionId);
    if (submissionIndex === -1) {
      throw new Error("Submission record not found.");
    }

    const submission = DEMO_SUBMISSIONS_DB[submissionIndex];
    const assignment = DEMO_ASSIGNMENTS_DB.find((a) => a.id === submission.assignmentId);

    if (!assignment) {
      throw new Error("Parent assignment not found.");
    }

    if (userRole !== Role.FACULTY && userRole !== Role.ADMIN) {
      throw new Error("Security Violation: You are not authorized to grade submissions.");
    }

    if (userRole === Role.FACULTY && assignment.facultyId !== facultyUserId) {
      throw new Error("Security Violation: You are not authorized to grade submissions for another faculty's course.");
    }

    if (data.marks < 0 || data.marks > assignment.maxMarks) {
      throw new Error(`Invalid Marks: Marks must be between 0 and ${assignment.maxMarks}.`);
    }

    const now = new Date().toISOString();
    const updated: DemoSubmission = {
      ...submission,
      marksObtained: data.marks,
      feedback: data.feedback,
      status: SubmissionStatus.GRADED,
      gradedBy: facultyUserId,
      gradedAt: now,
    };

    DEMO_SUBMISSIONS_DB[submissionIndex] = updated;

    // Send student notification
    await NotificationService.sendNotification({
      userId: submission.studentId,
      title: `Assignment Graded: ${assignment.title}`,
      message: `Your submission was graded: ${data.marks}/${assignment.maxMarks}. Feedback: "${data.feedback.substring(0, 80)}${data.feedback.length > 80 ? "..." : ""}"`,
      type: NotificationType.ASSIGNMENT,
      link: `/dashboard/student/assignments/${assignment.id}`,
    });

    // Audit Log
    try {
      if (await isDatabaseOnline()) {
        await prisma.auditLog.create({
          data: {
            userId: facultyUserId,
            action: "GRADE_SUBMISSION",
            entity: "AssignmentSubmission",
            entityId: submission.id,
            details: {
              assignmentId: assignment.id,
              studentId: submission.studentId,
              marksObtained: data.marks,
              maxMarks: assignment.maxMarks,
            },
          },
        });
      }
    } catch {
      // Offline fallback
    }

    return updated;
  }

  /**
   * Faculty / Admin: Retrieve institutional and faculty assignment performance analytics
   */
  static async getFacultyAnalytics(facultyUserId: string, userRole: Role) {
    let assignments = DEMO_ASSIGNMENTS_DB;
    if (userRole === Role.FACULTY) {
      assignments = assignments.filter((a) => a.facultyId === facultyUserId);
    }

    const assignmentIds = new Set(assignments.map((a) => a.id));
    const submissions = DEMO_SUBMISSIONS_DB.filter((s) => assignmentIds.has(s.assignmentId));

    const totalAssigned = assignments.length * DEMO_ENROLLED_STUDENTS.length;
    const totalSubmitted = submissions.length;
    const onTimeSubmissions = submissions.filter((s) => !s.isLate).length;
    const lateSubmissions = submissions.filter((s) => s.isLate).length;
    const gradedSubmissions = submissions.filter((s) => s.status === SubmissionStatus.GRADED).length;
    const pendingGrading = totalSubmitted - gradedSubmissions;

    const gradedMarks = submissions
      .filter((s) => typeof s.marksObtained === "number")
      .map((s) => s.marksObtained as number);

    const averageScore =
      gradedMarks.length > 0
        ? Math.round((gradedMarks.reduce((a, b) => a + b, 0) / gradedMarks.length) * 10) / 10
        : 0;

    const highestScore = gradedMarks.length > 0 ? Math.max(...gradedMarks) : 0;
    const lowestScore = gradedMarks.length > 0 ? Math.min(...gradedMarks) : 0;

    const submissionRate = totalAssigned > 0 ? Math.round((totalSubmitted / totalAssigned) * 100) : 0;
    const onTimeRate = totalSubmitted > 0 ? Math.round((onTimeSubmissions / totalSubmitted) * 100) : 0;

    // Grade distributions for Recharts
    const scoreBuckets = [
      { range: "90-100%", count: 0 },
      { range: "75-89%", count: 0 },
      { range: "60-74%", count: 0 },
      { range: "40-59%", count: 0 },
      { range: "< 40%", count: 0 },
    ];

    for (const sub of submissions) {
      if (typeof sub.marksObtained === "number") {
        const asgn = assignments.find((a) => a.id === sub.assignmentId);
        const max = asgn?.maxMarks || 100;
        const pct = (sub.marksObtained / max) * 100;

        if (pct >= 90) scoreBuckets[0].count++;
        else if (pct >= 75) scoreBuckets[1].count++;
        else if (pct >= 60) scoreBuckets[2].count++;
        else if (pct >= 40) scoreBuckets[3].count++;
        else scoreBuckets[4].count++;
      }
    }

    return {
      metrics: {
        totalAssignments: assignments.length,
        totalSubmissions: totalSubmitted,
        submissionRate,
        onTimeRate,
        lateSubmissions,
        gradedSubmissions,
        pendingGrading,
        averageScore,
        highestScore,
        lowestScore,
      },
      scoreDistribution: scoreBuckets,
    };
  }
}
