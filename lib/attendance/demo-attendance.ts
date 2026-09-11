import { AttendanceStatus } from "@prisma/client";

export interface DemoSubjectInfo {
  id: string;
  code: string;
  name: string;
  facultySubjectId: string;
  facultyId: string;
  facultyName: string;
  divisionId: string;
  divisionName: string;
  credits: number;
  semester: number;
}

export interface DemoSessionRecord {
  id: string;
  attendanceId: string;
  facultySubjectId: string;
  subjectCode: string;
  subjectName: string;
  facultyName: string;
  divisionId: string;
  date: string; // YYYY-MM-DD
  periodNumber: number;
  topicCovered: string;
  studentId: string;
  rollNumber: string;
  studentName: string;
  status: AttendanceStatus;
  remarks?: string;
  updatedAt: string;
}

export const DEMO_FACULTY_SUBJECTS: DemoSubjectInfo[] = [
  {
    id: "subj-dbms",
    code: "COMP-301",
    name: "Database Management Systems",
    facultySubjectId: "fs-dbms-div-a",
    facultyId: "demo-faculty-001",
    facultyName: "Prof. Meera Sen",
    divisionId: "div-comp-a",
    divisionName: "Division A",
    credits: 4,
    semester: 6,
  },
  {
    id: "subj-cn",
    code: "COMP-302",
    name: "Computer Networks",
    facultySubjectId: "fs-cn-div-a",
    facultyId: "demo-faculty-001",
    facultyName: "Prof. Meera Sen",
    divisionId: "div-comp-a",
    divisionName: "Division A",
    credits: 4,
    semester: 6,
  },
  {
    id: "subj-os",
    code: "COMP-303",
    name: "Operating Systems",
    facultySubjectId: "fs-os-div-a",
    facultyId: "demo-faculty-002",
    facultyName: "Prof. Arvind Kulkarni",
    divisionId: "div-comp-a",
    divisionName: "Division A",
    credits: 4,
    semester: 6,
  },
  {
    id: "subj-spm",
    code: "COMP-304",
    name: "Software Project Management",
    facultySubjectId: "fs-spm-div-a",
    facultyId: "demo-faculty-003",
    facultyName: "Dr. Sandeep Joshi",
    divisionId: "div-comp-a",
    divisionName: "Division A",
    credits: 3,
    semester: 6,
  },
];

export const DEMO_ENROLLED_STUDENTS = [
  { id: "demo-student-001", rollNumber: "22COMPA101", name: "Aarav Mehta", prn: "PRN2022014589" },
  { id: "demo-student-002", rollNumber: "22COMPA102", name: "Rohan Varma", prn: "PRN2022014590" },
  { id: "demo-student-003", rollNumber: "22COMPA103", name: "Sneha Patil", prn: "PRN2022014591" },
  { id: "demo-student-004", rollNumber: "22COMPA104", name: "Priya Nair", prn: "PRN2022014592" },
  { id: "demo-student-005", rollNumber: "22COMPA105", name: "Kabir Sharma", prn: "PRN2022014593" },
];

// In-memory mutable attendance records for simulation, demo, and offline testing
export const DEMO_ATTENDANCE_DATABASE: DemoSessionRecord[] = [];

// Helper to seed initial historical records
function generateInitialRecords() {
  const dates = [
    "2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04",
    "2026-09-07", "2026-09-08", "2026-09-09", "2026-09-10", "2026-09-11"
  ];

  let recordCounter = 1;

  dates.forEach((d, dateIdx) => {
    // 2 lectures per day
    DEMO_FACULTY_SUBJECTS.slice(0, 2).forEach((subj, subjIdx) => {
      const attendanceId = `att-sess-${dateIdx}-${subjIdx}`;
      const period = subjIdx === 0 ? 1 : 3;
      const topic = `Module ${subjIdx + 1}: Core Concepts Session ${dateIdx + 1}`;

      DEMO_ENROLLED_STUDENTS.forEach((student, stuIdx) => {
        let status: AttendanceStatus = AttendanceStatus.PRESENT;

        // Realistic student attendance profile distribution
        if (student.id === "demo-student-001") {
          // Aarav: 85-90% attendance (Misses only on day 2 and day 8 in CN)
          if ((dateIdx === 1 && subjIdx === 1) || (dateIdx === 7 && subjIdx === 0)) {
            status = AttendanceStatus.ABSENT;
          }
        } else if (student.id === "demo-student-002") {
          // Rohan: ~70% attendance (Warning)
          if (dateIdx % 3 === 0) {
            status = AttendanceStatus.ABSENT;
          }
        } else if (student.id === "demo-student-003") {
          // Sneha: ~55% attendance (Critical)
          if (dateIdx % 2 === 0) {
            status = AttendanceStatus.ABSENT;
          }
        } else if (student.id === "demo-student-004") {
          // Priya: 95% attendance (Safe)
          if (dateIdx === 4 && subjIdx === 0) {
            status = AttendanceStatus.ABSENT;
          }
        }

        DEMO_ATTENDANCE_DATABASE.push({
          id: `rec-${recordCounter++}`,
          attendanceId,
          facultySubjectId: subj.facultySubjectId,
          subjectCode: subj.code,
          subjectName: subj.name,
          facultyName: subj.facultyName,
          divisionId: subj.divisionId,
          date: d,
          periodNumber: period,
          topicCovered: topic,
          studentId: student.id,
          rollNumber: student.rollNumber,
          studentName: student.name,
          status,
          updatedAt: new Date().toISOString(),
        });
      });
    });
  });
}

generateInitialRecords();
