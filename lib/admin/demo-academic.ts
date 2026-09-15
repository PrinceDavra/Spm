import { SubjectType, RoomType } from "@prisma/client";

export interface DemoDepartment {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  headOfDepartment?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DemoProgram {
  id: string;
  name: string;
  code: string;
  degree: string;
  departmentId: string;
  durationYears: number;
  totalSemesters: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DemoBatch {
  id: string;
  name: string;
  startYear: number;
  endYear: number;
  programId: string;
  currentSemester: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DemoAcademicSemester {
  id: string;
  semesterNumber: number;
  academicYear: string;
  term: "ODD" | "EVEN" | "FALL" | "SPRING";
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DemoClass {
  id: string;
  departmentId: string;
  semester: number;
  name: string;
  academicYear: string;
  programId?: string | null;
  batchId?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DemoDivision {
  id: string;
  classId: string;
  name: string;
  code?: string | null;
  capacity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DemoSubject {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  semester: number;
  credits: number;
  type: SubjectType;
  weeklyHours: number;
  description?: string | null;
  syllabusUrl?: string | null;
  programId?: string | null;
  laboratoryId?: string | null;
  requiresLab: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DemoFacultyMapping {
  id: string;
  facultyId: string;
  subjectId: string;
  divisionId: string;
  academicYear: string;
  weeklyHours: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DemoRoom {
  id: string;
  roomNumber: string;
  building: string;
  floor: number;
  capacity: number;
  type: RoomType;
  hasProjector: boolean;
  isAvailable: boolean;
  departmentId?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DemoLaboratory {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  roomId?: string | null;
  capacity: number;
  equipment: string[];
  labAssistant?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// BASELINE SEED DATA
// ==========================================

const INITIAL_DEPARTMENTS: DemoDepartment[] = [
  {
    id: "dept-comp",
    name: "Computer Engineering",
    code: "COMP",
    description: "Core department specializing in Systems, AI, and Software Engineering",
    headOfDepartment: "Dr. Rajeshwar Sharma",
    isActive: true,
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
  {
    id: "dept-it",
    name: "Information Technology",
    code: "IT",
    description: "Department covering Cloud Computing, Cybersecurity, and Data Science",
    headOfDepartment: "Dr. S. K. Mahajan",
    isActive: true,
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
  {
    id: "dept-extc",
    name: "Electronics & Telecommunication",
    code: "EXTC",
    description: "Department focusing on Embedded Systems, Signal Processing, and IoT",
    headOfDepartment: "Dr. P. R. Joshi",
    isActive: true,
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
  {
    id: "dept-ash",
    name: "Applied Sciences & Humanities",
    code: "ASH",
    description: "Foundational mathematics, physics, and humanities for engineering",
    headOfDepartment: "Dr. N. V. Rao",
    isActive: true,
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
];

const INITIAL_PROGRAMS: DemoProgram[] = [
  {
    id: "prog-btech-cse",
    name: "Bachelor of Technology in Computer Engineering",
    code: "BTECH-CSE",
    degree: "B.Tech",
    departmentId: "dept-comp",
    durationYears: 4,
    totalSemesters: 8,
    isActive: true,
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
  {
    id: "prog-btech-it",
    name: "Bachelor of Technology in Information Technology",
    code: "BTECH-IT",
    degree: "B.Tech",
    departmentId: "dept-it",
    durationYears: 4,
    totalSemesters: 8,
    isActive: true,
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
  {
    id: "prog-btech-extc",
    name: "Bachelor of Technology in Electronics & Telecommunication",
    code: "BTECH-EXTC",
    degree: "B.Tech",
    departmentId: "dept-extc",
    durationYears: 4,
    totalSemesters: 8,
    isActive: true,
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
  {
    id: "prog-mca",
    name: "Master of Computer Applications",
    code: "MCA",
    degree: "MCA",
    departmentId: "dept-comp",
    durationYears: 2,
    totalSemesters: 4,
    isActive: true,
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
];

const INITIAL_BATCHES: DemoBatch[] = [
  {
    id: "batch-cse-2022",
    name: "Batch 2022-2026",
    startYear: 2022,
    endYear: 2026,
    programId: "prog-btech-cse",
    currentSemester: 6,
    isActive: true,
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
  {
    id: "batch-cse-2023",
    name: "Batch 2023-2027",
    startYear: 2023,
    endYear: 2027,
    programId: "prog-btech-cse",
    currentSemester: 4,
    isActive: true,
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
  {
    id: "batch-cse-2024",
    name: "Batch 2024-2028",
    startYear: 2024,
    endYear: 2028,
    programId: "prog-btech-cse",
    currentSemester: 2,
    isActive: true,
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
  {
    id: "batch-it-2022",
    name: "Batch 2022-2026",
    startYear: 2022,
    endYear: 2026,
    programId: "prog-btech-it",
    currentSemester: 6,
    isActive: true,
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
];

const INITIAL_SEMESTERS: DemoAcademicSemester[] = [
  {
    id: "sem-2024-6-even",
    semesterNumber: 6,
    academicYear: "2024-2025",
    term: "EVEN",
    startDate: "2025-01-06T00:00:00.000Z",
    endDate: "2025-05-15T00:00:00.000Z",
    isActive: true,
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
  {
    id: "sem-2024-4-even",
    semesterNumber: 4,
    academicYear: "2024-2025",
    term: "EVEN",
    startDate: "2025-01-06T00:00:00.000Z",
    endDate: "2025-05-15T00:00:00.000Z",
    isActive: true,
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
  {
    id: "sem-2024-2-even",
    semesterNumber: 2,
    academicYear: "2024-2025",
    term: "EVEN",
    startDate: "2025-01-06T00:00:00.000Z",
    endDate: "2025-05-15T00:00:00.000Z",
    isActive: true,
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
];

const INITIAL_CLASSES: DemoClass[] = [
  {
    id: "class-comp-te",
    departmentId: "dept-comp",
    semester: 6,
    name: "TE Computer Engineering",
    academicYear: "2024-2025",
    programId: "prog-btech-cse",
    batchId: "batch-cse-2022",
    isActive: true,
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
  {
    id: "class-comp-se",
    departmentId: "dept-comp",
    semester: 4,
    name: "SE Computer Engineering",
    academicYear: "2024-2025",
    programId: "prog-btech-cse",
    batchId: "batch-cse-2023",
    isActive: true,
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
  {
    id: "class-it-te",
    departmentId: "dept-it",
    semester: 6,
    name: "TE Information Technology",
    academicYear: "2024-2025",
    programId: "prog-btech-it",
    batchId: "batch-it-2022",
    isActive: true,
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
];

const INITIAL_DIVISIONS: DemoDivision[] = [
  {
    id: "div-comp-a",
    classId: "class-comp-te",
    name: "Division A",
    code: "CE-A",
    capacity: 70,
    isActive: true,
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
  {
    id: "div-comp-b",
    classId: "class-comp-te",
    name: "Division B",
    code: "CE-B",
    capacity: 70,
    isActive: true,
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
  {
    id: "div-it-a",
    classId: "class-it-te",
    name: "Division A",
    code: "IT-A",
    capacity: 65,
    isActive: true,
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
];

const INITIAL_ROOMS: DemoRoom[] = [
  {
    id: "room-201",
    roomNumber: "Room 201",
    building: "Academic Block A",
    floor: 2,
    capacity: 70,
    type: RoomType.CLASSROOM,
    hasProjector: true,
    isAvailable: true,
    departmentId: "dept-comp",
    isActive: true,
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
  {
    id: "room-202",
    roomNumber: "Room 202",
    building: "Academic Block A",
    floor: 2,
    capacity: 70,
    type: RoomType.CLASSROOM,
    hasProjector: true,
    isAvailable: true,
    departmentId: "dept-comp",
    isActive: true,
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
  {
    id: "room-301",
    roomNumber: "Room 301",
    building: "Academic Block B",
    floor: 3,
    capacity: 75,
    type: RoomType.CLASSROOM,
    hasProjector: true,
    isAvailable: true,
    departmentId: "dept-it",
    isActive: true,
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
  {
    id: "lab-1",
    roomNumber: "Computer Lab 1",
    building: "IT & Computing Complex",
    floor: 1,
    capacity: 40,
    type: RoomType.LAB,
    hasProjector: true,
    isAvailable: true,
    departmentId: "dept-comp",
    isActive: true,
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
  {
    id: "lab-2",
    roomNumber: "Network Systems Lab 2",
    building: "IT & Computing Complex",
    floor: 1,
    capacity: 40,
    type: RoomType.LAB,
    hasProjector: true,
    isAvailable: true,
    departmentId: "dept-comp",
    isActive: true,
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
  {
    id: "aud-main",
    roomNumber: "Central Auditorium",
    building: "Central Administration",
    floor: 0,
    capacity: 450,
    type: RoomType.AUDITORIUM,
    hasProjector: true,
    isAvailable: true,
    departmentId: null,
    isActive: true,
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
  {
    id: "seminar-hall-b",
    roomNumber: "Seminar Hall Block B",
    building: "Academic Block B",
    floor: 4,
    capacity: 120,
    type: RoomType.SEMINAR_HALL,
    hasProjector: true,
    isAvailable: true,
    departmentId: "dept-it",
    isActive: true,
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
];

const INITIAL_LABORATORIES: DemoLaboratory[] = [
  {
    id: "lab-res-01",
    name: "Advanced Database & Cloud Systems Laboratory",
    code: "LAB-CS-01",
    departmentId: "dept-comp",
    roomId: "lab-1",
    capacity: 35,
    equipment: [
      "35x Intel Core i7 32GB Workstations",
      "PostgreSQL Cluster Dedicated Node",
      "Gigabit Ethernet Switch",
    ],
    labAssistant: "Ramesh Pawar",
    isActive: true,
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
  {
    id: "lab-res-02",
    name: "High-Speed Computer Networks & Security Laboratory",
    code: "LAB-CS-02",
    departmentId: "dept-comp",
    roomId: "lab-2",
    capacity: 35,
    equipment: [
      "Cisco Catalyst Layer 3 Switches",
      "Wireshark Hardware Analyzers",
      "Optical Fiber Patch Racks",
    ],
    labAssistant: "Sunita Shinde",
    isActive: true,
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
  {
    id: "lab-res-03",
    name: "Hardware & Microprocessor Systems Laboratory",
    code: "LAB-EXTC-01",
    departmentId: "dept-extc",
    roomId: null, // intentionally unmapped room for health check testing
    capacity: 30,
    equipment: ["ARM Cortex-M4 Microcontroller Kits", "Digital Storage Oscilloscopes"],
    labAssistant: "Ganesh Patil",
    isActive: true,
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
];

const INITIAL_SUBJECTS: DemoSubject[] = [
  {
    id: "subj-dbms",
    code: "COMP-301",
    name: "Database Management Systems",
    departmentId: "dept-comp",
    semester: 6,
    credits: 4,
    type: SubjectType.THEORY,
    weeklyHours: 4,
    description: "Relational database concepts, SQL, transaction isolation, ACID guarantees, query indexing",
    syllabusUrl: "https://campussphere.edu/syllabus/comp-301.pdf",
    programId: "prog-btech-cse",
    requiresLab: false,
    laboratoryId: null,
    isActive: true,
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
  {
    id: "subj-cn",
    code: "COMP-302",
    name: "Computer Networks",
    departmentId: "dept-comp",
    semester: 6,
    credits: 4,
    type: SubjectType.THEORY,
    weeklyHours: 3,
    description: "OSI and TCP/IP protocol suite, sliding window, routing algorithms, socket programming",
    syllabusUrl: "https://campussphere.edu/syllabus/comp-302.pdf",
    programId: "prog-btech-cse",
    requiresLab: false,
    laboratoryId: null,
    isActive: true,
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
  {
    id: "subj-os",
    code: "COMP-303",
    name: "Operating Systems",
    departmentId: "dept-comp",
    semester: 6,
    credits: 4,
    type: SubjectType.THEORY,
    weeklyHours: 3,
    description: "Process management, CPU scheduling, synchronization, virtual memory, file systems",
    syllabusUrl: "https://campussphere.edu/syllabus/comp-303.pdf",
    programId: "prog-btech-cse",
    requiresLab: false,
    laboratoryId: null,
    isActive: true,
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
  {
    id: "subj-spm",
    code: "COMP-304",
    name: "Software Project Management",
    departmentId: "dept-comp",
    semester: 6,
    credits: 3,
    type: SubjectType.THEORY,
    weeklyHours: 3,
    description: "Agile methodologies, project estimation, COCOMO, risk assessment, quality assurance",
    syllabusUrl: "https://campussphere.edu/syllabus/comp-304.pdf",
    programId: "prog-btech-cse",
    requiresLab: false,
    laboratoryId: null,
    isActive: true,
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
  {
    id: "subj-dbms-lab",
    code: "COMP-305",
    name: "Database Systems Practical Lab",
    departmentId: "dept-comp",
    semester: 6,
    credits: 2,
    type: SubjectType.LAB,
    weeklyHours: 2,
    description: "Hands-on SQL schema creation, complex joins, indexing benchmarks, stored procedures",
    syllabusUrl: "https://campussphere.edu/syllabus/comp-305.pdf",
    programId: "prog-btech-cse",
    requiresLab: true,
    laboratoryId: "lab-res-01",
    isActive: true,
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
  {
    id: "subj-cn-lab",
    code: "COMP-306",
    name: "Computer Networks Practical Lab",
    departmentId: "dept-comp",
    semester: 6,
    credits: 2,
    type: SubjectType.LAB,
    weeklyHours: 2,
    description: "Packet capture with Wireshark, socket programming in C/Python, subnetting exercises",
    syllabusUrl: "https://campussphere.edu/syllabus/comp-306.pdf",
    programId: "prog-btech-cse",
    requiresLab: true,
    laboratoryId: "lab-res-02",
    isActive: true,
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
];

const INITIAL_FACULTY_MAPPINGS: DemoFacultyMapping[] = [
  {
    id: "fm-dbms-div-a",
    facultyId: "demo-faculty-001", // Prof. Meera Sen
    subjectId: "subj-dbms",
    divisionId: "div-comp-a",
    academicYear: "2024-2025",
    weeklyHours: 4,
    isActive: true,
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
  {
    id: "fm-cn-div-a",
    facultyId: "demo-faculty-001",
    subjectId: "subj-cn",
    divisionId: "div-comp-a",
    academicYear: "2024-2025",
    weeklyHours: 3,
    isActive: true,
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
  {
    id: "fm-dbms-lab-div-a",
    facultyId: "demo-faculty-001",
    subjectId: "subj-dbms-lab",
    divisionId: "div-comp-a",
    academicYear: "2024-2025",
    weeklyHours: 2,
    isActive: true,
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
  {
    id: "fm-os-div-a",
    facultyId: "demo-faculty-002", // Prof. Arvind Kulkarni
    subjectId: "subj-os",
    divisionId: "div-comp-a",
    academicYear: "2024-2025",
    weeklyHours: 3,
    isActive: true,
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
  {
    id: "fm-cn-lab-div-a",
    facultyId: "demo-faculty-002",
    subjectId: "subj-cn-lab",
    divisionId: "div-comp-a",
    academicYear: "2024-2025",
    weeklyHours: 2,
    isActive: true,
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
  {
    id: "fm-spm-div-a",
    facultyId: "demo-faculty-003", // Dr. Sandeep Joshi
    subjectId: "subj-spm",
    divisionId: "div-comp-a",
    academicYear: "2024-2025",
    weeklyHours: 3,
    isActive: true,
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
];

// In-memory active stores
export let DEMO_DEPARTMENTS: DemoDepartment[] = JSON.parse(JSON.stringify(INITIAL_DEPARTMENTS));
export let DEMO_PROGRAMS: DemoProgram[] = JSON.parse(JSON.stringify(INITIAL_PROGRAMS));
export let DEMO_BATCHES: DemoBatch[] = JSON.parse(JSON.stringify(INITIAL_BATCHES));
export let DEMO_SEMESTERS: DemoAcademicSemester[] = JSON.parse(JSON.stringify(INITIAL_SEMESTERS));
export let DEMO_CLASSES: DemoClass[] = JSON.parse(JSON.stringify(INITIAL_CLASSES));
export let DEMO_DIVISIONS: DemoDivision[] = JSON.parse(JSON.stringify(INITIAL_DIVISIONS));
export let DEMO_ROOMS: DemoRoom[] = JSON.parse(JSON.stringify(INITIAL_ROOMS));
export let DEMO_LABORATORIES: DemoLaboratory[] = JSON.parse(JSON.stringify(INITIAL_LABORATORIES));
export let DEMO_SUBJECTS: DemoSubject[] = JSON.parse(JSON.stringify(INITIAL_SUBJECTS));
export let DEMO_FACULTY_MAPPINGS: DemoFacultyMapping[] = JSON.parse(JSON.stringify(INITIAL_FACULTY_MAPPINGS));

/**
 * Resets all in-memory demo data to pristine baseline state.
 * Useful for automated tests and isolated runs.
 */
export function resetDemoAcademicStore(): void {
  DEMO_DEPARTMENTS = JSON.parse(JSON.stringify(INITIAL_DEPARTMENTS));
  DEMO_PROGRAMS = JSON.parse(JSON.stringify(INITIAL_PROGRAMS));
  DEMO_BATCHES = JSON.parse(JSON.stringify(INITIAL_BATCHES));
  DEMO_SEMESTERS = JSON.parse(JSON.stringify(INITIAL_SEMESTERS));
  DEMO_CLASSES = JSON.parse(JSON.stringify(INITIAL_CLASSES));
  DEMO_DIVISIONS = JSON.parse(JSON.stringify(INITIAL_DIVISIONS));
  DEMO_ROOMS = JSON.parse(JSON.stringify(INITIAL_ROOMS));
  DEMO_LABORATORIES = JSON.parse(JSON.stringify(INITIAL_LABORATORIES));
  DEMO_SUBJECTS = JSON.parse(JSON.stringify(INITIAL_SUBJECTS));
  DEMO_FACULTY_MAPPINGS = JSON.parse(JSON.stringify(INITIAL_FACULTY_MAPPINGS));
}
