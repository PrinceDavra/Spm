import { AssignmentStatus, SubmissionStatus } from "@prisma/client";

export interface DemoAttachment {
  id: string;
  assignmentId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number; // in bytes
  uploadedAt: string;
}

export interface DemoSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  submittedAt: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  submissionText?: string;
  comments?: string;
  marksObtained?: number | null;
  feedback?: string | null;
  isLate: boolean;
  latePenaltyApplied: number;
  version: number;
  status: SubmissionStatus;
  gradedBy?: string | null;
  gradedAt?: string | null;
}

export interface DemoAssignment {
  id: string;
  facultySubjectId: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  facultyId: string;
  facultyName: string;
  divisionId: string;
  divisionName: string;
  semester: number;
  title: string;
  description: string;
  instructions: string;
  maxMarks: number;
  dueDate: string; // ISO string
  publishDate: string;
  status: AssignmentStatus;
  allowLateSubmission: boolean;
  latePenalty: number; // % deducted
  maxFileSize: number; // in bytes
  allowedFileTypes: string[];
  attachments: DemoAttachment[];
  createdAt: string;
  updatedAt: string;
}

// Compute reference dates relative to now to ensure robust demos and live countdowns
const now = Date.now();
const hour = 3600 * 1000;
const day = 24 * hour;

export const INITIAL_DEMO_ASSIGNMENTS: DemoAssignment[] = [
  {
    id: "asgn-dbms-01",
    facultySubjectId: "fs-dbms-div-a",
    subjectId: "subj-dbms",
    subjectCode: "COMP-301",
    subjectName: "Database Management Systems",
    facultyId: "demo-faculty-001",
    facultyName: "Prof. Meera Sen",
    divisionId: "div-comp-a",
    divisionName: "Division A",
    semester: 6,
    title: "Relational Schema Normalization & BCNF Decomposition",
    description: "Design a normalized database schema up to Boyce-Codd Normal Form (BCNF) for an enterprise supply chain logistics platform.",
    instructions: "1. Identify functional dependencies.\n2. Compute minimal cover.\n3. Decompose relations ensuring lossless-join and dependency preservation.\n4. Provide sample SQL DDL statements with appropriate constraints.",
    maxMarks: 100,
    dueDate: new Date(now + 18 * hour).toISOString(), // Due in 18 hours (Due Soon)
    publishDate: new Date(now - 4 * day).toISOString(),
    status: AssignmentStatus.PUBLISHED,
    allowLateSubmission: true,
    latePenalty: 10,
    maxFileSize: 10485760, // 10MB
    allowedFileTypes: ["pdf", "docx", "sql", "zip"],
    attachments: [
      {
        id: "att-dbms-01",
        assignmentId: "asgn-dbms-01",
        fileName: "Supply_Chain_Entity_Requirements.pdf",
        fileUrl: "/sample-docs/Supply_Chain_Entity_Requirements.pdf",
        fileType: "application/pdf",
        fileSize: 142850,
        uploadedAt: new Date(now - 4 * day).toISOString(),
      },
    ],
    createdAt: new Date(now - 4 * day).toISOString(),
    updatedAt: new Date(now - 4 * day).toISOString(),
  },
  {
    id: "asgn-cn-01",
    facultySubjectId: "fs-cn-div-a",
    subjectId: "subj-cn",
    subjectCode: "COMP-302",
    subjectName: "Computer Networks",
    facultyId: "demo-faculty-001",
    facultyName: "Prof. Meera Sen",
    divisionId: "div-comp-a",
    divisionName: "Division A",
    semester: 6,
    title: "TCP Congestion Control & Wireshark Packet Analysis",
    description: "Capture and analyze TCP Tahoe vs Reno congestion window dynamics using Wireshark traces under simulated packet loss.",
    instructions: "Submit packet analysis report in PDF format alongside the exported .pcapng trace file. Highlight Slow Start, Congestion Avoidance, and Fast Retransmit events.",
    maxMarks: 50,
    dueDate: new Date(now + 3 * day).toISOString(), // Upcoming (3 days)
    publishDate: new Date(now - 2 * day).toISOString(),
    status: AssignmentStatus.PUBLISHED,
    allowLateSubmission: true,
    latePenalty: 15,
    maxFileSize: 15728640, // 15MB
    allowedFileTypes: ["pdf", "zip", "pcapng"],
    attachments: [
      {
        id: "att-cn-01",
        assignmentId: "asgn-cn-01",
        fileName: "Wireshark_Trace_Lab_Instructions.pdf",
        fileUrl: "/sample-docs/Wireshark_Trace_Lab_Instructions.pdf",
        fileType: "application/pdf",
        fileSize: 224100,
        uploadedAt: new Date(now - 2 * day).toISOString(),
      },
    ],
    createdAt: new Date(now - 2 * day).toISOString(),
    updatedAt: new Date(now - 2 * day).toISOString(),
  },
  {
    id: "asgn-os-01",
    facultySubjectId: "fs-os-div-a",
    subjectId: "subj-os",
    subjectCode: "COMP-303",
    subjectName: "Operating Systems",
    facultyId: "demo-faculty-002",
    facultyName: "Prof. Rajesh Kulkarni",
    divisionId: "div-comp-a",
    divisionName: "Division A",
    semester: 6,
    title: "Multithreaded Producer-Consumer with POSIX Semaphores",
    description: "Implement a robust multithreaded circular bounded buffer in C/C++ demonstrating thread synchronization and deadlock avoidance.",
    instructions: "Provide Makefile, cleanly commented source code (.c/.cpp), and a brief verification log showing no memory leaks under Valgrind.",
    maxMarks: 100,
    dueDate: new Date(now - 3 * day).toISOString(), // Past deadline (Graded)
    publishDate: new Date(now - 10 * day).toISOString(),
    status: AssignmentStatus.PUBLISHED,
    allowLateSubmission: false,
    latePenalty: 0,
    maxFileSize: 5242880, // 5MB
    allowedFileTypes: ["zip", "tar.gz", "c", "cpp", "pdf"],
    attachments: [],
    createdAt: new Date(now - 10 * day).toISOString(),
    updatedAt: new Date(now - 10 * day).toISOString(),
  },
  {
    id: "asgn-cloud-01",
    facultySubjectId: "fs-cloud-div-a",
    subjectId: "subj-cloud",
    subjectCode: "COMP-305",
    subjectName: "Cloud Computing",
    facultyId: "demo-faculty-002",
    facultyName: "Prof. Rajesh Kulkarni",
    divisionId: "div-comp-a",
    divisionName: "Division A",
    semester: 6,
    title: "Containerized Microservices Deployment with Docker & Kubernetes",
    description: "Deconstruct a monolithic REST application into containerized microservices and write Kubernetes deployment/service YAML manifests.",
    instructions: "Submit your Dockerfile, k8s manifest definitions, and screenshots of pods, services, and ingress running in Minikube/K3s.",
    maxMarks: 100,
    dueDate: new Date(now + 6 * day).toISOString(), // Upcoming (6 days)
    publishDate: new Date(now - 1 * day).toISOString(),
    status: AssignmentStatus.PUBLISHED,
    allowLateSubmission: true,
    latePenalty: 10,
    maxFileSize: 20971520, // 20MB
    allowedFileTypes: ["zip", "pdf", "yaml", "yml"],
    attachments: [
      {
        id: "att-cloud-01",
        assignmentId: "asgn-cloud-01",
        fileName: "K8s_Architecture_Rubric.pdf",
        fileUrl: "/sample-docs/K8s_Architecture_Rubric.pdf",
        fileType: "application/pdf",
        fileSize: 310500,
        uploadedAt: new Date(now - 1 * day).toISOString(),
      },
    ],
    createdAt: new Date(now - 1 * day).toISOString(),
    updatedAt: new Date(now - 1 * day).toISOString(),
  },
  {
    id: "asgn-se-01",
    facultySubjectId: "fs-se-div-a",
    subjectId: "subj-se",
    subjectCode: "COMP-304",
    subjectName: "Software Engineering",
    facultyId: "demo-faculty-003",
    facultyName: "Prof. Sneha Joshi",
    divisionId: "div-comp-a",
    divisionName: "Division A",
    semester: 6,
    title: "Agile Sprint Backlog & SRS Specification Document",
    description: "Author an IEEE 830 compliant Software Requirements Specification (SRS) along with an Epic and User Story backlog for a healthcare teleconsultation app.",
    instructions: "Include use case diagrams, functional vs non-functional requirements, acceptance criteria with Gherkin syntax, and sprint point estimations.",
    maxMarks: 75,
    dueDate: new Date(now - 1 * day).toISOString(), // Passed yesterday (Late submission demo)
    publishDate: new Date(now - 7 * day).toISOString(),
    status: AssignmentStatus.PUBLISHED,
    allowLateSubmission: true,
    latePenalty: 10,
    maxFileSize: 10485760,
    allowedFileTypes: ["pdf", "docx"],
    attachments: [],
    createdAt: new Date(now - 7 * day).toISOString(),
    updatedAt: new Date(now - 7 * day).toISOString(),
  },
  {
    id: "asgn-ai-01",
    facultySubjectId: "fs-ai-div-a",
    subjectId: "subj-ai",
    subjectCode: "COMP-306",
    subjectName: "Artificial Intelligence",
    facultyId: "demo-faculty-003",
    facultyName: "Prof. Sneha Joshi",
    divisionId: "div-comp-a",
    divisionName: "Division A",
    semester: 6,
    title: "A* Search & Constraint Satisfaction for Sudoku Solver",
    description: "Formulate the 9x9 Sudoku problem as a Constraint Satisfaction Problem with MRV heuristic and AC-3 constraint propagation.",
    instructions: "Submit Jupyter Notebook (.ipynb) or Python script (.py) along with a benchmark report comparing standard backtracking against MRV + forward checking.",
    maxMarks: 50,
    dueDate: new Date(now + 5 * day).toISOString(), // Upcoming (5 days)
    publishDate: new Date(now - 2 * day).toISOString(),
    status: AssignmentStatus.PUBLISHED,
    allowLateSubmission: true,
    latePenalty: 10,
    maxFileSize: 10485760,
    allowedFileTypes: ["pdf", "ipynb", "py", "zip"],
    attachments: [],
    createdAt: new Date(now - 2 * day).toISOString(),
    updatedAt: new Date(now - 2 * day).toISOString(),
  },
  {
    id: "asgn-dbms-draft",
    facultySubjectId: "fs-dbms-div-a",
    subjectId: "subj-dbms",
    subjectCode: "COMP-301",
    subjectName: "Database Management Systems",
    facultyId: "demo-faculty-001",
    facultyName: "Prof. Meera Sen",
    divisionId: "div-comp-a",
    divisionName: "Division A",
    semester: 6,
    title: "Distributed Two-Phase Locking & Raft Consensus",
    description: "Comprehensive case study on transaction concurrency and 2PL protocols in high-throughput distributed database engines.",
    instructions: "Draft assignment undergoing syllabus committee review.",
    maxMarks: 100,
    dueDate: new Date(now + 14 * day).toISOString(),
    publishDate: new Date(now).toISOString(),
    status: AssignmentStatus.DRAFT,
    allowLateSubmission: true,
    latePenalty: 10,
    maxFileSize: 10485760,
    allowedFileTypes: ["pdf", "docx"],
    attachments: [],
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
  },
  {
    id: "asgn-cn-closed",
    facultySubjectId: "fs-cn-div-a",
    subjectId: "subj-cn",
    subjectCode: "COMP-302",
    subjectName: "Computer Networks",
    facultyId: "demo-faculty-001",
    facultyName: "Prof. Meera Sen",
    divisionId: "div-comp-a",
    divisionName: "Division A",
    semester: 6,
    title: "CIDR Subnetting & IP Routing Table Design",
    description: "Calculate classless inter-domain routing subnets and design route aggregation tables for an ISP backbone.",
    instructions: "Submissions are formally archived and closed.",
    maxMarks: 50,
    dueDate: new Date(now - 14 * day).toISOString(),
    publishDate: new Date(now - 28 * day).toISOString(),
    status: AssignmentStatus.CLOSED,
    allowLateSubmission: false,
    latePenalty: 0,
    maxFileSize: 10485760,
    allowedFileTypes: ["pdf"],
    attachments: [],
    createdAt: new Date(now - 28 * day).toISOString(),
    updatedAt: new Date(now - 14 * day).toISOString(),
  },
  {
    id: "asgn-dbms-02",
    facultySubjectId: "fs-dbms-div-a",
    subjectId: "subj-dbms",
    subjectCode: "COMP-301",
    subjectName: "Database Management Systems",
    facultyId: "demo-faculty-001",
    facultyName: "Prof. Meera Sen",
    divisionId: "div-comp-a",
    divisionName: "Division A",
    semester: 6,
    title: "SQL Query Optimization & Indexing Strategies",
    description: "Benchmark B-Tree vs Hash index scan performance on 1,000,000 synthetic transaction rows in PostgreSQL.",
    instructions: "Submit EXPLAIN ANALYZE execution plans before and after composite indexing.",
    maxMarks: 50,
    dueDate: new Date(now + 8 * day).toISOString(),
    publishDate: new Date(now - 1 * day).toISOString(),
    status: AssignmentStatus.PUBLISHED,
    allowLateSubmission: true,
    latePenalty: 5,
    maxFileSize: 10485760,
    allowedFileTypes: ["pdf", "sql", "zip"],
    attachments: [],
    createdAt: new Date(now - 1 * day).toISOString(),
    updatedAt: new Date(now - 1 * day).toISOString(),
  },
  {
    id: "asgn-os-02",
    facultySubjectId: "fs-os-div-a",
    subjectId: "subj-os",
    subjectCode: "COMP-303",
    subjectName: "Operating Systems",
    facultyId: "demo-faculty-002",
    facultyName: "Prof. Rajesh Kulkarni",
    divisionId: "div-comp-a",
    divisionName: "Division A",
    semester: 6,
    title: "Virtual Memory Paging & LRU Page Replacement Simulation",
    description: "Simulate FIFO, Optimal, and Least-Recently-Used (LRU) page replacement algorithms across memory reference strings.",
    instructions: "Graph page fault frequency against allocated frame count (3 to 10 frames).",
    maxMarks: 75,
    dueDate: new Date(now + 10 * day).toISOString(),
    publishDate: new Date(now - 3 * day).toISOString(),
    status: AssignmentStatus.PUBLISHED,
    allowLateSubmission: true,
    latePenalty: 10,
    maxFileSize: 10485760,
    allowedFileTypes: ["pdf", "py", "cpp", "zip"],
    attachments: [],
    createdAt: new Date(now - 3 * day).toISOString(),
    updatedAt: new Date(now - 3 * day).toISOString(),
  },
  {
    id: "asgn-cloud-02",
    facultySubjectId: "fs-cloud-div-a",
    subjectId: "subj-cloud",
    subjectCode: "COMP-305",
    subjectName: "Cloud Computing",
    facultyId: "demo-faculty-002",
    facultyName: "Prof. Rajesh Kulkarni",
    divisionId: "div-comp-a",
    divisionName: "Division A",
    semester: 6,
    title: "Serverless Event-Driven Architecture with AWS Lambda / Knative",
    description: "Design an image thumbnail generation pipeline triggered by object storage bucket upload events.",
    instructions: "Submit infrastructure-as-code scripts (Terraform/SAM) and pipeline architecture diagrams.",
    maxMarks: 100,
    dueDate: new Date(now + 12 * day).toISOString(),
    publishDate: new Date(now - 2 * day).toISOString(),
    status: AssignmentStatus.PUBLISHED,
    allowLateSubmission: true,
    latePenalty: 10,
    maxFileSize: 15728640,
    allowedFileTypes: ["pdf", "zip"],
    attachments: [],
    createdAt: new Date(now - 2 * day).toISOString(),
    updatedAt: new Date(now - 2 * day).toISOString(),
  },
  {
    id: "asgn-se-02",
    facultySubjectId: "fs-se-div-a",
    subjectId: "subj-se",
    subjectCode: "COMP-304",
    subjectName: "Software Engineering",
    facultyId: "demo-faculty-003",
    facultyName: "Prof. Sneha Joshi",
    divisionId: "div-comp-a",
    divisionName: "Division A",
    semester: 6,
    title: "CI/CD Pipeline Design with Automated Unit Testing & Linting",
    description: "Setup GitHub Actions workflow with automated test runs, code coverage reporting, and SonarQube static analysis.",
    instructions: "Provide repository link and sanitized workflow configuration YAML file.",
    maxMarks: 50,
    dueDate: new Date(now + 15 * day).toISOString(),
    publishDate: new Date(now - 1 * day).toISOString(),
    status: AssignmentStatus.PUBLISHED,
    allowLateSubmission: true,
    latePenalty: 10,
    maxFileSize: 10485760,
    allowedFileTypes: ["pdf", "yaml", "yml", "zip"],
    attachments: [],
    createdAt: new Date(now - 1 * day).toISOString(),
    updatedAt: new Date(now - 1 * day).toISOString(),
  },
];

// Initial demo submissions
export const INITIAL_DEMO_SUBMISSIONS: DemoSubmission[] = [
  // Aarav Mehta (demo-student-001) submissions:
  {
    id: "sub-os-aarav",
    assignmentId: "asgn-os-01",
    studentId: "demo-student-001",
    studentName: "Aarav Mehta",
    rollNumber: "22COMPA101",
    submittedAt: new Date(now - 4 * day).toISOString(),
    fileUrl: "/sample-submissions/22COMPA101_OS_Bounded_Buffer.zip",
    fileName: "22COMPA101_OS_Bounded_Buffer.zip",
    fileSize: 428000,
    fileType: "application/zip",
    submissionText: "Implemented circular producer-consumer buffer with POSIX pthread mutexes and empty/full semaphores. Verified zero deadlocks under 16 concurrent worker threads.",
    comments: "Verified Valgrind output confirms 0 bytes in 0 blocks allocated.",
    marksObtained: 94,
    feedback: "Exceptional code quality and elegant synchronization logic. Clean memory profiling report. Full marks on concurrent safety.",
    isLate: false,
    latePenaltyApplied: 0,
    version: 1,
    status: SubmissionStatus.GRADED,
    gradedBy: "demo-faculty-002",
    gradedAt: new Date(now - 2 * day).toISOString(),
  },
  {
    id: "sub-cn-aarav",
    assignmentId: "asgn-cn-01",
    studentId: "demo-student-001",
    studentName: "Aarav Mehta",
    rollNumber: "22COMPA101",
    submittedAt: new Date(now - 1 * day).toISOString(),
    fileUrl: "/sample-submissions/22COMPA101_Wireshark_TCP_Analysis.pdf",
    fileName: "22COMPA101_Wireshark_TCP_Analysis.pdf",
    fileSize: 1285000,
    fileType: "application/pdf",
    submissionText: "Analyzed Wireshark trace of an HTTP file transfer under 3% simulated packet drop. Plotted cwnd vs RTT progression.",
    comments: "Includes packet capture trace file as appendix.",
    marksObtained: null,
    feedback: null,
    isLate: false,
    latePenaltyApplied: 0,
    version: 1,
    status: SubmissionStatus.SUBMITTED, // Submitted, pending grading
  },
  {
    id: "sub-se-aarav",
    assignmentId: "asgn-se-01",
    studentId: "demo-student-001",
    studentName: "Aarav Mehta",
    rollNumber: "22COMPA101",
    submittedAt: new Date(now - 4 * hour).toISOString(), // Submitted 20 hours after deadline
    fileUrl: "/sample-submissions/22COMPA101_SRS_Document.pdf",
    fileName: "22COMPA101_SRS_Document.pdf",
    fileSize: 840000,
    fileType: "application/pdf",
    submissionText: "Comprehensive SRS document covering teleconsultation patient-doctor interaction flows with user story mapping.",
    comments: "Apologies for the slight delay due to campus network maintenance.",
    marksObtained: null,
    feedback: null,
    isLate: true,
    latePenaltyApplied: 10,
    version: 1,
    status: SubmissionStatus.LATE, // Late submission
  },

  // Diya Patel (demo-student-002) submissions:
  {
    id: "sub-os-diya",
    assignmentId: "asgn-os-01",
    studentId: "demo-student-002",
    studentName: "Diya Patel",
    rollNumber: "22COMPA102",
    submittedAt: new Date(now - 5 * day).toISOString(),
    fileUrl: "/sample-submissions/22COMPA102_OS_Sync.zip",
    fileName: "22COMPA102_OS_Sync.zip",
    fileSize: 390000,
    fileType: "application/zip",
    submissionText: "POSIX semaphores implementation with buffer overflow guards.",
    marksObtained: 88,
    feedback: "Well structured implementation. Minor issue in thread teardown order, but synchronization core is sound.",
    isLate: false,
    latePenaltyApplied: 0,
    version: 1,
    status: SubmissionStatus.GRADED,
    gradedBy: "demo-faculty-002",
    gradedAt: new Date(now - 2 * day).toISOString(),
  },
  {
    id: "sub-dbms-diya",
    assignmentId: "asgn-dbms-01",
    studentId: "demo-student-002",
    studentName: "Diya Patel",
    rollNumber: "22COMPA102",
    submittedAt: new Date(now - 6 * hour).toISOString(),
    fileUrl: "/sample-submissions/22COMPA102_DBMS_Normalization.pdf",
    fileName: "22COMPA102_DBMS_Normalization.pdf",
    fileSize: 640000,
    fileType: "application/pdf",
    submissionText: "BCNF decomposition diagrams and PostgreSQL DDL scripts.",
    marksObtained: null,
    feedback: null,
    isLate: false,
    latePenaltyApplied: 0,
    version: 1,
    status: SubmissionStatus.SUBMITTED,
  },

  // Rohan Kulkarni (demo-student-003) submissions:
  {
    id: "sub-os-rohan",
    assignmentId: "asgn-os-01",
    studentId: "demo-student-003",
    studentName: "Rohan Kulkarni",
    rollNumber: "22COMPA103",
    submittedAt: new Date(now - 4 * day).toISOString(),
    fileUrl: "/sample-submissions/22COMPA103_OS_Lab.zip",
    fileName: "22COMPA103_OS_Lab.zip",
    fileSize: 450000,
    fileType: "application/zip",
    submissionText: "Bounded buffer implementation with monitor simulation.",
    marksObtained: 91,
    feedback: "Great work on condition variables and robust mutex management.",
    isLate: false,
    latePenaltyApplied: 0,
    version: 1,
    status: SubmissionStatus.GRADED,
    gradedBy: "demo-faculty-002",
    gradedAt: new Date(now - 2 * day).toISOString(),
  },
  {
    id: "sub-se-rohan",
    assignmentId: "asgn-se-01",
    studentId: "demo-student-003",
    studentName: "Rohan Kulkarni",
    rollNumber: "22COMPA103",
    submittedAt: new Date(now - 2 * day).toISOString(),
    fileUrl: "/sample-submissions/22COMPA103_SRS_Specification.pdf",
    fileName: "22COMPA103_SRS_Specification.pdf",
    fileSize: 920000,
    fileType: "application/pdf",
    submissionText: "SRS with UML activity and sequence diagrams.",
    marksObtained: 70,
    feedback: "Solid requirements breakdown. Sprint story points are well estimated.",
    isLate: false,
    latePenaltyApplied: 0,
    version: 1,
    status: SubmissionStatus.GRADED,
    gradedBy: "demo-faculty-003",
    gradedAt: new Date(now - 12 * hour).toISOString(),
  },

  // Ananya Sharma (demo-student-004) submissions:
  {
    id: "sub-os-ananya",
    assignmentId: "asgn-os-01",
    studentId: "demo-student-004",
    studentName: "Ananya Sharma",
    rollNumber: "22COMPA104",
    submittedAt: new Date(now - 4 * day).toISOString(),
    fileUrl: "/sample-submissions/22COMPA104_OS_Solution.zip",
    fileName: "22COMPA104_OS_Solution.zip",
    fileSize: 510000,
    fileType: "application/zip",
    submissionText: "Producer consumer solution in C with Makefile.",
    marksObtained: 85,
    feedback: "Good implementation. Consider adding more descriptive logging for thread states.",
    isLate: false,
    latePenaltyApplied: 0,
    version: 1,
    status: SubmissionStatus.GRADED,
    gradedBy: "demo-faculty-002",
    gradedAt: new Date(now - 2 * day).toISOString(),
  },
];

// Runtime active in-memory store for dynamic mutations
export const DEMO_ASSIGNMENTS_DB: DemoAssignment[] = [...INITIAL_DEMO_ASSIGNMENTS];
export const DEMO_SUBMISSIONS_DB: DemoSubmission[] = [...INITIAL_DEMO_SUBMISSIONS];
