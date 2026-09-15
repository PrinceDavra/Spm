import { ExamType, ExamStatus, RevaluationStatus } from "@prisma/client";

export interface DemoExam {
  id: string;
  title: string;
  examType: ExamType;
  academicYear: string;
  semesterNumber: number;
  departmentId: string;
  programId?: string | null;
  batchId?: string | null;
  divisionId?: string | null;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  credits: number;
  date: string; // ISO date string YYYY-MM-DD
  startTime: string; // "10:00"
  endTime: string; // "13:00"
  roomId?: string | null;
  roomNumber?: string | null;
  facultyId?: string | null; // assigned invigilator
  facultyName?: string | null;
  maxMarks: number;
  passingMarks: number;
  instructions?: string | null;
  status: ExamStatus;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DemoExamEnrollment {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  prnNumber: string;
  isEligible: boolean;
  ineligibilityReason?: string | null;
  hallTicketNumber?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DemoGradebookEntry {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  marksObtained: number | null;
  isAbsent: boolean;
  gradeLetter: string | null;
  gradePoint: number | null;
  isPassed: boolean;
  remarks?: string | null;
  gradedBy?: string | null;
  gradedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DemoSubjectGrade {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  credits: number;
  maxMarks: number;
  marksObtained: number;
  percentage: number;
  gradeLetter: string;
  gradePoint: number;
  isPassed: boolean;
  isAbsent: boolean;
}

export interface DemoExamResult {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  prnNumber: string;
  academicYear: string;
  semesterNumber: number;
  examTitle?: string;
  gpa: number;
  totalCreditsAttempted: number;
  totalCreditsEarned: number;
  status: "PUBLISHED" | "LOCKED";
  publishedAt: string;
  publishedBy?: string | null;
  lockedAt?: string | null;
  lockedBy?: string | null;
  subjectGrades: DemoSubjectGrade[];
  createdAt: string;
  updatedAt: string;
}

export interface DemoRevaluationRequest {
  id: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  reason: string;
  currentMarks: number;
  requestedMarks?: number | null;
  reviewedMarks?: number | null;
  status: RevaluationStatus;
  reviewerRemarks?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TranscriptSemesterRecord {
  semesterNumber: number;
  academicYear: string;
  term: string;
  gpa: number;
  creditsAttempted: number;
  creditsEarned: number;
  subjects: DemoSubjectGrade[];
}

export interface StudentAcademicTranscript {
  student: {
    id: string;
    userId: string;
    name: string;
    rollNumber: string;
    prnNumber: string;
    department: string;
    program: string;
    batch: string;
    currentSemester: number;
  };
  semesters: TranscriptSemesterRecord[];
  summary: {
    totalCreditsAttempted: number;
    totalCreditsEarned: number;
    cumulativeCgpa: number;
    degreeClassification: string; // e.g. "First Class with Distinction"
    academicStatus: "ELIGIBLE_FOR_DEGREE" | "IN_PROGRESS" | "PROBATION";
    issuedDate: string;
    referenceNumber: string;
  };
}

/**
 * Deterministic Grade Calculation helper using the standard 10-point university scale.
 */
export function calculateGrade(marks: number, maxMarks: number, isAbsent = false) {
  if (isAbsent) {
    return {
      percentage: 0,
      gradeLetter: "F",
      gradePoint: 0,
      isPassed: false,
    };
  }

  const percentage = maxMarks > 0 ? Math.round((marks / maxMarks) * 1000) / 10 : 0;

  if (percentage >= 90) return { percentage, gradeLetter: "A+", gradePoint: 10.0, isPassed: true };
  if (percentage >= 80) return { percentage, gradeLetter: "A", gradePoint: 9.0, isPassed: true };
  if (percentage >= 70) return { percentage, gradeLetter: "B+", gradePoint: 8.0, isPassed: true };
  if (percentage >= 60) return { percentage, gradeLetter: "B", gradePoint: 7.0, isPassed: true };
  if (percentage >= 50) return { percentage, gradeLetter: "C", gradePoint: 6.0, isPassed: true };
  if (percentage >= 40) return { percentage, gradeLetter: "D", gradePoint: 5.0, isPassed: true };
  return { percentage, gradeLetter: "F", gradePoint: 0.0, isPassed: false };
}

/**
 * Deterministic Degree Classification based on CGPA.
 */
export function getDegreeClassification(cgpa: number): string {
  if (cgpa >= 7.5) return "First Class with Distinction";
  if (cgpa >= 6.5) return "First Class";
  if (cgpa >= 5.5) return "Higher Second Class";
  if (cgpa >= 5.0) return "Second Class";
  if (cgpa >= 4.0) return "Pass Class";
  return "Fail";
}

// -------------------------------------------------------------
// BASELINE DEMO DATA STORES
// -------------------------------------------------------------

export const DEMO_EXAMS_STORE: DemoExam[] = [
  {
    id: "exam-001",
    title: "Midterm Assessment — Cloud Computing",
    examType: ExamType.MIDTERM,
    academicYear: "2024-2025",
    semesterNumber: 6,
    departmentId: "dept-ce",
    programId: "prog-btech-ce",
    batchId: "batch-2022-2026",
    divisionId: "div-comp-a",
    subjectId: "sub-cs601",
    subjectCode: "CS601",
    subjectName: "Cloud Computing Architecture",
    credits: 4,
    date: "2026-03-10",
    startTime: "10:00",
    endTime: "11:30",
    roomId: "room-301",
    roomNumber: "LH-301",
    facultyId: "demo-faculty-001",
    facultyName: "Dr. Meera Patel",
    maxMarks: 50,
    passingMarks: 20,
    instructions: "Scientific calculators allowed. Mobile phones strictly prohibited in the exam hall.",
    status: ExamStatus.PUBLISHED,
    createdBy: "demo-admin-001",
    createdAt: "2026-02-15T09:00:00Z",
    updatedAt: "2026-03-12T14:00:00Z",
  },
  {
    id: "exam-002",
    title: "Midterm Assessment — Machine Learning",
    examType: ExamType.MIDTERM,
    academicYear: "2024-2025",
    semesterNumber: 6,
    departmentId: "dept-ce",
    programId: "prog-btech-ce",
    batchId: "batch-2022-2026",
    divisionId: "div-comp-a",
    subjectId: "sub-cs602",
    subjectCode: "CS602",
    subjectName: "Machine Learning & Neural Networks",
    credits: 4,
    date: "2026-03-12",
    startTime: "10:00",
    endTime: "11:30",
    roomId: "room-302",
    roomNumber: "LH-302",
    facultyId: "demo-faculty-001",
    facultyName: "Dr. Meera Patel",
    maxMarks: 50,
    passingMarks: 20,
    instructions: "Closed-book exam. Formula sheet will be provided with the question paper.",
    status: ExamStatus.PUBLISHED,
    createdBy: "demo-admin-001",
    createdAt: "2026-02-15T09:00:00Z",
    updatedAt: "2026-03-13T16:00:00Z",
  },
  {
    id: "exam-003",
    title: "Practical Viva Examination — Cloud Computing Lab",
    examType: ExamType.PRACTICAL,
    academicYear: "2024-2025",
    semesterNumber: 6,
    departmentId: "dept-ce",
    programId: "prog-btech-ce",
    batchId: "batch-2022-2026",
    divisionId: "div-comp-a",
    subjectId: "sub-cs601l",
    subjectCode: "CS601L",
    subjectName: "Cloud Computing Lab Practical",
    credits: 2,
    date: "2026-03-14",
    startTime: "09:00",
    endTime: "12:00",
    roomId: "room-lab-101",
    roomNumber: "LAB-101",
    facultyId: "demo-faculty-001",
    facultyName: "Dr. Meera Patel",
    maxMarks: 25,
    passingMarks: 10,
    instructions: "Individual practical viva and Kubernetes cluster deployment demonstration.",
    status: ExamStatus.PUBLISHED,
    createdBy: "demo-admin-001",
    createdAt: "2026-02-15T09:00:00Z",
    updatedAt: "2026-03-15T12:00:00Z",
  },
  {
    id: "exam-004",
    title: "End-Semester Examination — Information Security",
    examType: ExamType.END_SEMESTER,
    academicYear: "2024-2025",
    semesterNumber: 6,
    departmentId: "dept-ce",
    programId: "prog-btech-ce",
    batchId: "batch-2022-2026",
    divisionId: "div-comp-a",
    subjectId: "sub-cs603",
    subjectCode: "CS603",
    subjectName: "Information & Network Security",
    credits: 4,
    date: "2026-04-20",
    startTime: "10:00",
    endTime: "13:00",
    roomId: "room-301",
    roomNumber: "LH-301",
    facultyId: "demo-faculty-001",
    facultyName: "Dr. Meera Patel",
    maxMarks: 100,
    passingMarks: 40,
    instructions: "Standard 3-hour university end-semester examination.",
    status: ExamStatus.RESULTS_PENDING,
    createdBy: "demo-admin-001",
    createdAt: "2026-03-01T09:00:00Z",
    updatedAt: "2026-04-25T11:00:00Z",
  },
  {
    id: "exam-005",
    title: "End-Semester Examination — Software Engineering",
    examType: ExamType.END_SEMESTER,
    academicYear: "2024-2025",
    semesterNumber: 6,
    departmentId: "dept-ce",
    programId: "prog-btech-ce",
    batchId: "batch-2022-2026",
    divisionId: "div-comp-a",
    subjectId: "sub-cs604",
    subjectCode: "CS604",
    subjectName: "Software Engineering & Agile Methodologies",
    credits: 3,
    date: "2026-04-24",
    startTime: "10:00",
    endTime: "13:00",
    roomId: "room-302",
    roomNumber: "LH-302",
    facultyId: "demo-faculty-001",
    facultyName: "Dr. Meera Patel",
    maxMarks: 100,
    passingMarks: 40,
    instructions: "Hall tickets and university ID card mandatory.",
    status: ExamStatus.SCHEDULED,
    createdBy: "demo-admin-001",
    createdAt: "2026-03-01T09:00:00Z",
    updatedAt: "2026-03-01T09:00:00Z",
  },
  {
    id: "exam-006",
    title: "Midterm Assessment — Advanced Database Systems",
    examType: ExamType.MIDTERM,
    academicYear: "2024-2025",
    semesterNumber: 6,
    departmentId: "dept-ce",
    programId: "prog-btech-ce",
    batchId: "batch-2022-2026",
    divisionId: "div-comp-a",
    subjectId: "sub-cs605",
    subjectCode: "CS605",
    subjectName: "Distributed & NoSQL Database Systems",
    credits: 3,
    date: "2026-05-02",
    startTime: "14:00",
    endTime: "15:30",
    roomId: null,
    roomNumber: null,
    facultyId: null,
    facultyName: null,
    maxMarks: 50,
    passingMarks: 20,
    instructions: null,
    status: ExamStatus.DRAFT,
    createdBy: "demo-admin-001",
    createdAt: "2026-03-05T10:00:00Z",
    updatedAt: "2026-03-05T10:00:00Z",
  },
  {
    id: "exam-007",
    title: "University End-Semester Examination — Design & Analysis of Algorithms",
    examType: ExamType.END_SEMESTER,
    academicYear: "2023-2024",
    semesterNumber: 4,
    departmentId: "dept-ce",
    programId: "prog-btech-ce",
    batchId: "batch-2022-2026",
    divisionId: "div-comp-a",
    subjectId: "sub-cs401",
    subjectCode: "CS401",
    subjectName: "Design & Analysis of Algorithms",
    credits: 4,
    date: "2024-05-18",
    startTime: "10:00",
    endTime: "13:00",
    roomId: "room-301",
    roomNumber: "LH-301",
    facultyId: "demo-faculty-001",
    facultyName: "Dr. Meera Patel",
    maxMarks: 100,
    passingMarks: 40,
    instructions: "Locked historical university examination record.",
    status: ExamStatus.LOCKED,
    createdBy: "demo-admin-001",
    createdAt: "2024-04-01T09:00:00Z",
    updatedAt: "2024-06-01T10:00:00Z",
  },
];

export const DEMO_EXAM_ENROLLMENTS_STORE: DemoExamEnrollment[] = [
  {
    id: "enr-001",
    examId: "exam-001",
    studentId: "demo-student-001",
    studentName: "Aarav Mehta",
    rollNumber: "22COMPA101",
    prnNumber: "PRN2022014589",
    isEligible: true,
    ineligibilityReason: null,
    hallTicketNumber: "HT-2025-60101",
    createdAt: "2026-02-20T10:00:00Z",
    updatedAt: "2026-02-20T10:00:00Z",
  },
  {
    id: "enr-002",
    examId: "exam-001",
    studentId: "demo-student-002",
    studentName: "Priya Sharma",
    rollNumber: "22COMPA102",
    prnNumber: "PRN2022014590",
    isEligible: true,
    ineligibilityReason: null,
    hallTicketNumber: "HT-2025-60102",
    createdAt: "2026-02-20T10:00:00Z",
    updatedAt: "2026-02-20T10:00:00Z",
  },
  {
    id: "enr-003",
    examId: "exam-001",
    studentId: "demo-student-003",
    studentName: "Rahul Verma",
    rollNumber: "22COMPA103",
    prnNumber: "PRN2022014591",
    isEligible: false,
    ineligibilityReason: "Debarred: Attendance below 65% (current: 58.4%)",
    hallTicketNumber: null,
    createdAt: "2026-02-20T10:00:00Z",
    updatedAt: "2026-02-20T10:00:00Z",
  },
  {
    id: "enr-004",
    examId: "exam-002",
    studentId: "demo-student-001",
    studentName: "Aarav Mehta",
    rollNumber: "22COMPA101",
    prnNumber: "PRN2022014589",
    isEligible: true,
    ineligibilityReason: null,
    hallTicketNumber: "HT-2025-60201",
    createdAt: "2026-02-20T10:00:00Z",
    updatedAt: "2026-02-20T10:00:00Z",
  },
  {
    id: "enr-005",
    examId: "exam-003",
    studentId: "demo-student-001",
    studentName: "Aarav Mehta",
    rollNumber: "22COMPA101",
    prnNumber: "PRN2022014589",
    isEligible: true,
    ineligibilityReason: null,
    hallTicketNumber: "HT-2025-60301",
    createdAt: "2026-02-20T10:00:00Z",
    updatedAt: "2026-02-20T10:00:00Z",
  },
  {
    id: "enr-006",
    examId: "exam-004",
    studentId: "demo-student-001",
    studentName: "Aarav Mehta",
    rollNumber: "22COMPA101",
    prnNumber: "PRN2022014589",
    isEligible: true,
    ineligibilityReason: null,
    hallTicketNumber: "HT-2025-60401",
    createdAt: "2026-03-10T10:00:00Z",
    updatedAt: "2026-03-10T10:00:00Z",
  },
];

export const DEMO_GRADEBOOK_STORE: DemoGradebookEntry[] = [
  // Exam 1: Cloud Computing (Max 50)
  {
    id: "gb-001",
    examId: "exam-001",
    studentId: "demo-student-001",
    studentName: "Aarav Mehta",
    rollNumber: "22COMPA101",
    marksObtained: 44,
    isAbsent: false,
    gradeLetter: "A",
    gradePoint: 9.0,
    isPassed: true,
    remarks: "Demonstrated strong grasp of microservices architecture.",
    gradedBy: "demo-faculty-001",
    gradedAt: "2026-03-11T16:00:00Z",
    createdAt: "2026-03-11T16:00:00Z",
    updatedAt: "2026-03-11T16:00:00Z",
  },
  {
    id: "gb-002",
    examId: "exam-001",
    studentId: "demo-student-002",
    studentName: "Priya Sharma",
    rollNumber: "22COMPA102",
    marksObtained: 48,
    isAbsent: false,
    gradeLetter: "A+",
    gradePoint: 10.0,
    isPassed: true,
    remarks: "Excellent theoretical and architectural answers.",
    gradedBy: "demo-faculty-001",
    gradedAt: "2026-03-11T16:15:00Z",
    createdAt: "2026-03-11T16:15:00Z",
    updatedAt: "2026-03-11T16:15:00Z",
  },
  {
    id: "gb-003",
    examId: "exam-001",
    studentId: "demo-student-003",
    studentName: "Rahul Verma",
    rollNumber: "22COMPA103",
    marksObtained: 0,
    isAbsent: true,
    gradeLetter: "F",
    gradePoint: 0.0,
    isPassed: false,
    remarks: "Student was absent from the examination hall.",
    gradedBy: "demo-faculty-001",
    gradedAt: "2026-03-11T16:30:00Z",
    createdAt: "2026-03-11T16:30:00Z",
    updatedAt: "2026-03-11T16:30:00Z",
  },

  // Exam 2: Machine Learning (Max 50)
  {
    id: "gb-004",
    examId: "exam-002",
    studentId: "demo-student-001",
    studentName: "Aarav Mehta",
    rollNumber: "22COMPA101",
    marksObtained: 47,
    isAbsent: false,
    gradeLetter: "A+",
    gradePoint: 10.0,
    isPassed: true,
    remarks: "Flawless mathematical derivation of backpropagation.",
    gradedBy: "demo-faculty-001",
    gradedAt: "2026-03-13T14:00:00Z",
    createdAt: "2026-03-13T14:00:00Z",
    updatedAt: "2026-03-13T14:00:00Z",
  },

  // Exam 3: Cloud Lab Practical (Max 25)
  {
    id: "gb-005",
    examId: "exam-003",
    studentId: "demo-student-001",
    studentName: "Aarav Mehta",
    rollNumber: "22COMPA101",
    marksObtained: 23,
    isAbsent: false,
    gradeLetter: "A+",
    gradePoint: 10.0,
    isPassed: true,
    remarks: "Quick and clean deployment of Helm chart on local cluster.",
    gradedBy: "demo-faculty-001",
    gradedAt: "2026-03-14T17:00:00Z",
    createdAt: "2026-03-14T17:00:00Z",
    updatedAt: "2026-03-14T17:00:00Z",
  },

  // Exam 4: Information Security (Max 100) - Results Pending
  {
    id: "gb-006",
    examId: "exam-004",
    studentId: "demo-student-001",
    studentName: "Aarav Mehta",
    rollNumber: "22COMPA101",
    marksObtained: 82,
    isAbsent: false,
    gradeLetter: "A",
    gradePoint: 9.0,
    isPassed: true,
    remarks: "Good analysis of cryptographic handshake vulnerabilities.",
    gradedBy: "demo-faculty-001",
    gradedAt: "2026-04-22T10:00:00Z",
    createdAt: "2026-04-22T10:00:00Z",
    updatedAt: "2026-04-22T10:00:00Z",
  },
];

export const DEMO_EXAM_RESULTS_STORE: DemoExamResult[] = [
  // Semester 6 (Current Academic Year 2024-2025) - Published
  {
    id: "res-sem6-001",
    studentId: "demo-student-001",
    studentName: "Aarav Mehta",
    rollNumber: "22COMPA101",
    prnNumber: "PRN2022014589",
    academicYear: "2024-2025",
    semesterNumber: 6,
    examTitle: "Semester VI Midterm & Practical Evaluations",
    gpa: 9.40,
    totalCreditsAttempted: 10,
    totalCreditsEarned: 10,
    status: "PUBLISHED",
    publishedAt: "2026-03-16T10:00:00Z",
    publishedBy: "demo-admin-001",
    lockedAt: null,
    lockedBy: null,
    subjectGrades: [
      {
        subjectId: "sub-cs601",
        subjectCode: "CS601",
        subjectName: "Cloud Computing Architecture",
        credits: 4,
        maxMarks: 50,
        marksObtained: 44,
        percentage: 88.0,
        gradeLetter: "A",
        gradePoint: 9.0,
        isPassed: true,
        isAbsent: false,
      },
      {
        subjectId: "sub-cs602",
        subjectCode: "CS602",
        subjectName: "Machine Learning & Neural Networks",
        credits: 4,
        maxMarks: 50,
        marksObtained: 47,
        percentage: 94.0,
        gradeLetter: "A+",
        gradePoint: 10.0,
        isPassed: true,
        isAbsent: false,
      },
      {
        subjectId: "sub-cs601l",
        subjectCode: "CS601L",
        subjectName: "Cloud Computing Lab Practical",
        credits: 2,
        maxMarks: 25,
        marksObtained: 23,
        percentage: 92.0,
        gradeLetter: "A+",
        gradePoint: 10.0,
        isPassed: true,
        isAbsent: false,
      },
    ],
    createdAt: "2026-03-16T10:00:00Z",
    updatedAt: "2026-03-16T10:00:00Z",
  },
];

export const DEMO_REVALUATION_STORE: DemoRevaluationRequest[] = [
  {
    id: "rev-001",
    examId: "exam-001",
    examTitle: "Midterm Assessment — Cloud Computing",
    studentId: "demo-student-001",
    studentName: "Aarav Mehta",
    rollNumber: "22COMPA101",
    subjectId: "sub-cs601",
    subjectCode: "CS601",
    subjectName: "Cloud Computing Architecture",
    reason: "Question 4 part b (Virtualization models) was not evaluated on the supplementary sheet.",
    currentMarks: 44,
    requestedMarks: 48,
    reviewedMarks: 46,
    status: RevaluationStatus.APPROVED,
    reviewerRemarks: "Supplementary sheet verified. 2 additional marks awarded for Question 4(b).",
    reviewedBy: "demo-admin-001",
    reviewedAt: "2026-03-18T14:00:00Z",
    createdAt: "2026-03-17T11:00:00Z",
    updatedAt: "2026-03-18T14:00:00Z",
  },
  {
    id: "rev-002",
    examId: "exam-002",
    examTitle: "Midterm Assessment — Machine Learning",
    studentId: "demo-student-002",
    studentName: "Priya Sharma",
    rollNumber: "22COMPA102",
    subjectId: "sub-cs602",
    subjectCode: "CS602",
    subjectName: "Machine Learning & Neural Networks",
    reason: "Totaling error on page 3. Sum of sub-question marks indicates 49 instead of 48.",
    currentMarks: 48,
    requestedMarks: 49,
    reviewedMarks: null,
    status: RevaluationStatus.PENDING,
    reviewerRemarks: null,
    reviewedBy: null,
    reviewedAt: null,
    createdAt: "2026-03-19T09:30:00Z",
    updatedAt: "2026-03-19T09:30:00Z",
  },
];

/**
 * Historical transcript records for Semesters 1 to 5 for complete official transcript generation.
 */
export const DEMO_HISTORICAL_TRANSCRIPTS: Record<string, TranscriptSemesterRecord[]> = {
  "demo-student-001": [
    {
      semesterNumber: 1,
      academicYear: "2022-2023",
      term: "ODD",
      gpa: 8.73,
      creditsAttempted: 22,
      creditsEarned: 22,
      subjects: [
        { subjectId: "cs101", subjectCode: "FE101", subjectName: "Engineering Mathematics I", credits: 4, maxMarks: 100, marksObtained: 85, percentage: 85.0, gradeLetter: "A", gradePoint: 9.0, isPassed: true, isAbsent: false },
        { subjectId: "cs102", subjectCode: "FE102", subjectName: "Engineering Physics", credits: 4, maxMarks: 100, marksObtained: 82, percentage: 82.0, gradeLetter: "A", gradePoint: 9.0, isPassed: true, isAbsent: false },
        { subjectId: "cs103", subjectCode: "FE103", subjectName: "Basic Electrical Engineering", credits: 4, maxMarks: 100, marksObtained: 78, percentage: 78.0, gradeLetter: "B+", gradePoint: 8.0, isPassed: true, isAbsent: false },
        { subjectId: "cs104", subjectCode: "FE104", subjectName: "Programming in C", credits: 4, maxMarks: 100, marksObtained: 92, percentage: 92.0, gradeLetter: "A+", gradePoint: 10.0, isPassed: true, isAbsent: false },
        { subjectId: "cs105", subjectCode: "FE105", subjectName: "Engineering Graphics", credits: 3, maxMarks: 100, marksObtained: 76, percentage: 76.0, gradeLetter: "B+", gradePoint: 8.0, isPassed: true, isAbsent: false },
        { subjectId: "cs106", subjectCode: "FE106L", subjectName: "C Programming Laboratory", credits: 3, maxMarks: 50, marksObtained: 46, percentage: 92.0, gradeLetter: "A+", gradePoint: 10.0, isPassed: true, isAbsent: false },
      ],
    },
    {
      semesterNumber: 2,
      academicYear: "2022-2023",
      term: "EVEN",
      gpa: 8.91,
      creditsAttempted: 22,
      creditsEarned: 22,
      subjects: [
        { subjectId: "cs201", subjectCode: "FE201", subjectName: "Engineering Mathematics II", credits: 4, maxMarks: 100, marksObtained: 88, percentage: 88.0, gradeLetter: "A", gradePoint: 9.0, isPassed: true, isAbsent: false },
        { subjectId: "cs202", subjectCode: "FE202", subjectName: "Engineering Chemistry", credits: 4, maxMarks: 100, marksObtained: 80, percentage: 80.0, gradeLetter: "A", gradePoint: 9.0, isPassed: true, isAbsent: false },
        { subjectId: "cs203", subjectCode: "FE203", subjectName: "Object-Oriented Programming (C++)", credits: 4, maxMarks: 100, marksObtained: 94, percentage: 94.0, gradeLetter: "A+", gradePoint: 10.0, isPassed: true, isAbsent: false },
        { subjectId: "cs204", subjectCode: "FE204", subjectName: "Engineering Mechanics", credits: 4, maxMarks: 100, marksObtained: 79, percentage: 79.0, gradeLetter: "B+", gradePoint: 8.0, isPassed: true, isAbsent: false },
        { subjectId: "cs205", subjectCode: "FE205", subjectName: "Professional Communication", credits: 3, maxMarks: 100, marksObtained: 85, percentage: 85.0, gradeLetter: "A", gradePoint: 9.0, isPassed: true, isAbsent: false },
        { subjectId: "cs206", subjectCode: "FE206L", subjectName: "OOP Laboratory", credits: 3, maxMarks: 50, marksObtained: 47, percentage: 94.0, gradeLetter: "A+", gradePoint: 10.0, isPassed: true, isAbsent: false },
      ],
    },
    {
      semesterNumber: 3,
      academicYear: "2023-2024",
      term: "ODD",
      gpa: 9.08,
      creditsAttempted: 24,
      creditsEarned: 24,
      subjects: [
        { subjectId: "cs301", subjectCode: "CS301", subjectName: "Discrete Mathematics", credits: 4, maxMarks: 100, marksObtained: 91, percentage: 91.0, gradeLetter: "A+", gradePoint: 10.0, isPassed: true, isAbsent: false },
        { subjectId: "cs302", subjectCode: "CS302", subjectName: "Data Structures & Algorithms", credits: 4, maxMarks: 100, marksObtained: 93, percentage: 93.0, gradeLetter: "A+", gradePoint: 10.0, isPassed: true, isAbsent: false },
        { subjectId: "cs303", subjectCode: "CS303", subjectName: "Digital Logic & Computer Architecture", credits: 4, maxMarks: 100, marksObtained: 84, percentage: 84.0, gradeLetter: "A", gradePoint: 9.0, isPassed: true, isAbsent: false },
        { subjectId: "cs304", subjectCode: "CS304", subjectName: "Electronic Devices & Circuits", credits: 4, maxMarks: 100, marksObtained: 76, percentage: 76.0, gradeLetter: "B+", gradePoint: 8.0, isPassed: true, isAbsent: false },
        { subjectId: "cs305", subjectCode: "CS305L", subjectName: "Data Structures Laboratory", credits: 4, maxMarks: 50, marksObtained: 48, percentage: 96.0, gradeLetter: "A+", gradePoint: 10.0, isPassed: true, isAbsent: false },
        { subjectId: "cs306", subjectCode: "CS306L", subjectName: "Digital Design Laboratory", credits: 4, maxMarks: 50, marksObtained: 44, percentage: 88.0, gradeLetter: "A", gradePoint: 9.0, isPassed: true, isAbsent: false },
      ],
    },
    {
      semesterNumber: 4,
      academicYear: "2023-2024",
      term: "EVEN",
      gpa: 8.83,
      creditsAttempted: 24,
      creditsEarned: 24,
      subjects: [
        { subjectId: "cs401", subjectCode: "CS401", subjectName: "Design & Analysis of Algorithms", credits: 4, maxMarks: 100, marksObtained: 89, percentage: 89.0, gradeLetter: "A", gradePoint: 9.0, isPassed: true, isAbsent: false },
        { subjectId: "cs402", subjectCode: "CS402", subjectName: "Operating Systems Principles", credits: 4, maxMarks: 100, marksObtained: 86, percentage: 86.0, gradeLetter: "A", gradePoint: 9.0, isPassed: true, isAbsent: false },
        { subjectId: "cs403", subjectCode: "CS403", subjectName: "Database Management Systems", credits: 4, maxMarks: 100, marksObtained: 92, percentage: 92.0, gradeLetter: "A+", gradePoint: 10.0, isPassed: true, isAbsent: false },
        { subjectId: "cs404", subjectCode: "CS404", subjectName: "Formal Languages & Automata Theory", credits: 4, maxMarks: 100, marksObtained: 74, percentage: 74.0, gradeLetter: "B+", gradePoint: 8.0, isPassed: true, isAbsent: false },
        { subjectId: "cs405", subjectCode: "CS405L", subjectName: "Operating Systems Laboratory", credits: 4, maxMarks: 50, marksObtained: 46, percentage: 92.0, gradeLetter: "A+", gradePoint: 10.0, isPassed: true, isAbsent: false },
        { subjectId: "cs406", subjectCode: "CS406L", subjectName: "DBMS Laboratory", credits: 4, maxMarks: 50, marksObtained: 45, percentage: 90.0, gradeLetter: "A+", gradePoint: 10.0, isPassed: true, isAbsent: false },
      ],
    },
    {
      semesterNumber: 5,
      academicYear: "2024-2025",
      term: "ODD",
      gpa: 9.09,
      creditsAttempted: 22,
      creditsEarned: 22,
      subjects: [
        { subjectId: "cs501", subjectCode: "CS501", subjectName: "Computer Networks & Protocols", credits: 4, maxMarks: 100, marksObtained: 88, percentage: 88.0, gradeLetter: "A", gradePoint: 9.0, isPassed: true, isAbsent: false },
        { subjectId: "cs502", subjectCode: "CS502", subjectName: "Theory of Computation & Compilers", credits: 4, maxMarks: 100, marksObtained: 85, percentage: 85.0, gradeLetter: "A", gradePoint: 9.0, isPassed: true, isAbsent: false },
        { subjectId: "cs503", subjectCode: "CS503", subjectName: "Web Technologies & Cloud Fundamentals", credits: 4, maxMarks: 100, marksObtained: 95, percentage: 95.0, gradeLetter: "A+", gradePoint: 10.0, isPassed: true, isAbsent: false },
        { subjectId: "cs504", subjectCode: "CS504", subjectName: "Software Engineering Principles", credits: 4, maxMarks: 100, marksObtained: 84, percentage: 84.0, gradeLetter: "A", gradePoint: 9.0, isPassed: true, isAbsent: false },
        { subjectId: "cs505", subjectCode: "CS505L", subjectName: "Computer Networks Laboratory", credits: 3, maxMarks: 50, marksObtained: 47, percentage: 94.0, gradeLetter: "A+", gradePoint: 10.0, isPassed: true, isAbsent: false },
        { subjectId: "cs506", subjectCode: "CS506L", subjectName: "Web Technologies Laboratory", credits: 3, maxMarks: 50, marksObtained: 49, percentage: 98.0, gradeLetter: "A+", gradePoint: 10.0, isPassed: true, isAbsent: false },
      ],
    },
  ],
};
