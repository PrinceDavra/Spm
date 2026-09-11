import { NoticeCategory, NoticePriority, NoticeAudience, NoticeStatus } from "@prisma/client";

export interface DemoNoticeAttachment {
  id: string;
  noticeId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number; // bytes
  uploadedAt: string;
}

export interface DemoNoticeRead {
  id: string;
  noticeId: string;
  userId: string;
  readAt: string;
}

export interface DemoNotice {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  title: string;
  summary: string;
  content: string;
  category: NoticeCategory;
  priority: NoticePriority;
  audience: NoticeAudience;
  status: NoticeStatus;
  departmentId?: string | null;
  departmentName?: string | null;
  classId?: string | null;
  className?: string | null;
  divisionId?: string | null;
  divisionName?: string | null;
  semester?: number | null;
  publishDate: string;
  expiryDate?: string | null;
  attachmentUrl?: string | null;
  isPublished: boolean;
  attachments: DemoNoticeAttachment[];
  reads: DemoNoticeRead[];
  createdAt: string;
  updatedAt: string;
}

export const INITIAL_DEMO_NOTICES: DemoNotice[] = [
  {
    id: "notice-001",
    authorId: "demo-admin-001",
    authorName: "Office of the Controller of Examinations",
    authorRole: "ADMIN",
    title: "Mid-Semester Examination Schedule — Term II 2024-2025",
    summary: "Comprehensive timetable, hall ticket instructions, and examination code of conduct for all undergraduate engineering semesters.",
    content: `### Term II Mid-Semester Examination Schedule

All undergraduate students across Semester 2, 4, 6, and 8 are hereby notified that Mid-Semester Examinations will commence from **March 24, 2025**.

#### Key Directives:
1. **Reporting Time:** Students must report to their assigned examination halls at least 20 minutes prior to the commencement of each paper.
2. **Identity & Hall Tickets:** Carrying the physical Institutional Smart Card and printed Hall Ticket is mandatory.
3. **Prohibited Items:** Smart watches, mobile devices, programmable calculators, and unauthorized printed matter are strictly prohibited inside the hall.
4. **Disability Accommodations:** Candidates entitled to extra time or scribes must submit approved permissions to the COE desk before March 18, 2025.

Refer to the attached timetable for subject-wise slot assignments and room allocations.`,
    category: NoticeCategory.EXAMINATION,
    priority: NoticePriority.URGENT,
    audience: NoticeAudience.ALL,
    status: NoticeStatus.PUBLISHED,
    publishDate: "2025-03-01T09:00:00.000Z",
    expiryDate: "2025-04-15T23:59:59.000Z",
    attachmentUrl: "/downloads/Mid_Sem_Exam_Schedule_2025.pdf",
    isPublished: true,
    attachments: [
      {
        id: "att-001",
        noticeId: "notice-001",
        fileName: "Mid_Sem_Exam_Schedule_2025.pdf",
        fileUrl: "/downloads/Mid_Sem_Exam_Schedule_2025.pdf",
        fileType: "application/pdf",
        fileSize: 1468006, // 1.4 MB
        uploadedAt: "2025-03-01T09:00:00.000Z",
      },
    ],
    reads: [
      {
        id: "read-001",
        noticeId: "notice-001",
        userId: "demo-student-001",
        readAt: "2025-03-02T10:15:00.000Z",
      },
      {
        id: "read-002",
        noticeId: "notice-001",
        userId: "demo-faculty-001",
        readAt: "2025-03-01T11:00:00.000Z",
      },
    ],
    createdAt: "2025-03-01T08:30:00.000Z",
    updatedAt: "2025-03-01T09:00:00.000Z",
  },
  {
    id: "notice-002",
    authorId: "demo-admin-001",
    authorName: "Dean of Academic Affairs",
    authorRole: "ADMIN",
    title: "Mandatory 75% Attendance Compliance Advisory for Mid-Term Audits",
    summary: "Students falling below the statutory 75% threshold in any subject must submit verified condonation appeals before Friday.",
    content: `### Statutory Attendance Compliance Advisory

In accordance with University Academic Regulation Clause 4.2, students are reminded that a minimum aggregate of **75% attendance** is required across theory and laboratory subjects to be eligible for end-semester and mid-term assessments.

#### Action Items for Defaulter Students:
- Check your real-time attendance percentages in the CampusSphere Student Dashboard.
- If your aggregate falls between 60% and 74% on medical or extracurricular grounds, submit relevant official documentation to your Class Coordinator.
- Students failing to condone unexcused absences before Friday, 5:00 PM will face detention from relevant mid-term papers.`,
    category: NoticeCategory.ATTENDANCE,
    priority: NoticePriority.IMPORTANT,
    audience: NoticeAudience.STUDENTS,
    status: NoticeStatus.PUBLISHED,
    publishDate: "2025-03-03T11:30:00.000Z",
    expiryDate: "2025-03-20T23:59:59.000Z",
    attachmentUrl: "/downloads/Attendance_Defaulter_List_Audit.pdf",
    isPublished: true,
    attachments: [
      {
        id: "att-002",
        noticeId: "notice-002",
        fileName: "Attendance_Defaulter_List_Audit.pdf",
        fileUrl: "/downloads/Attendance_Defaulter_List_Audit.pdf",
        fileType: "application/pdf",
        fileSize: 860160,
        uploadedAt: "2025-03-03T11:30:00.000Z",
      },
    ],
    reads: [], // Unread by demo-student-001
    createdAt: "2025-03-03T11:00:00.000Z",
    updatedAt: "2025-03-03T11:30:00.000Z",
  },
  {
    id: "notice-003",
    authorId: "demo-admin-001",
    authorName: "Training & Placement Cell",
    authorRole: "ADMIN",
    title: "Microsoft Campus Recruitment Drive 2025: SDE-1 Applications Open",
    summary: "Eligible B.Tech pre-final and final year candidates with CGPA >= 8.0 are invited to apply for online coding assessments.",
    content: `### Campus Placement Notice: Microsoft India

Microsoft India is visiting CampusSphere for its annual full-time Software Development Engineer (SDE-1) hiring drive.

#### Eligibility Criteria:
- Degree: B.Tech in Computer Engineering, Information Technology, or Electronics.
- Cutoff: Minimum CGPA of 8.00 with zero active backlogs.
- Package Offered: INR 44.5 LPA (CTC).

#### Selection Stages:
1. Online Coding Round (Data Structures, Algorithms, System Concepts).
2. Technical Rounds I & II (System Design & Problem Solving).
3. Leadership & Culture Fit Interview.

Interested students must register on the Placement Portal before Sunday midnight.`,
    category: NoticeCategory.PLACEMENT,
    priority: NoticePriority.IMPORTANT,
    audience: NoticeAudience.STUDENTS,
    departmentId: "dept-comp",
    departmentName: "Computer Engineering",
    status: NoticeStatus.PUBLISHED,
    publishDate: "2025-03-04T14:00:00.000Z",
    expiryDate: "2025-03-25T23:59:59.000Z",
    attachmentUrl: "/downloads/Microsoft_Campus_Hiring_JD_2025.pdf",
    isPublished: true,
    attachments: [
      {
        id: "att-003",
        noticeId: "notice-003",
        fileName: "Microsoft_Campus_Hiring_JD_2025.pdf",
        fileUrl: "/downloads/Microsoft_Campus_Hiring_JD_2025.pdf",
        fileType: "application/pdf",
        fileSize: 532480,
        uploadedAt: "2025-03-04T14:00:00.000Z",
      },
    ],
    reads: [
      {
        id: "read-003",
        noticeId: "notice-003",
        userId: "demo-student-001",
        readAt: "2025-03-04T16:20:00.000Z",
      },
    ],
    createdAt: "2025-03-04T13:45:00.000Z",
    updatedAt: "2025-03-04T14:00:00.000Z",
  },
  {
    id: "notice-004",
    authorId: "demo-faculty-001",
    authorName: "Dr. Ramesh Sharma, Faculty Advisor",
    authorRole: "FACULTY",
    title: "Annual Technical Symposium 'TechnoSphere 2025' — Call for Project Papers",
    summary: "Submissions open for technical research papers, 36-hour hackathon tracks, and innovative hardware demonstrations.",
    content: `### TechnoSphere 2025 — Call for Contributions

The Department of Computer Engineering is thrilled to host the 12th National Level Technical Symposium, **TechnoSphere 2025**.

#### Event Tracks:
- **Track 1:** AI & Large Language Models in Scalable Web Systems.
- **Track 2:** Distributed Databases & Cloud Resilience.
- **Track 3:** IoT, Robotics & Autonomous Embedded Platforms.
- **Track 4:** 36-Hour Open Innovation Hackathon with total cash pool of INR 2,50,000.

Submit your IEEE format two-column abstract through the conference portal by March 28.`,
    category: NoticeCategory.EVENT,
    priority: NoticePriority.NORMAL,
    audience: NoticeAudience.ALL,
    status: NoticeStatus.PUBLISHED,
    publishDate: "2025-03-05T10:00:00.000Z",
    expiryDate: "2025-04-05T23:59:59.000Z",
    attachmentUrl: "/downloads/TechnoSphere_2025_Call_For_Papers.pdf",
    isPublished: true,
    attachments: [
      {
        id: "att-004",
        noticeId: "notice-004",
        fileName: "TechnoSphere_2025_Call_For_Papers.pdf",
        fileUrl: "/downloads/TechnoSphere_2025_Call_For_Papers.pdf",
        fileType: "application/pdf",
        fileSize: 2202009,
        uploadedAt: "2025-03-05T10:00:00.000Z",
      },
    ],
    reads: [
      {
        id: "read-004",
        noticeId: "notice-004",
        userId: "demo-student-001",
        readAt: "2025-03-05T12:40:00.000Z",
      },
    ],
    createdAt: "2025-03-05T09:30:00.000Z",
    updatedAt: "2025-03-05T10:00:00.000Z",
  },
  {
    id: "notice-005",
    authorId: "demo-faculty-001",
    authorName: "Dr. Ramesh Sharma, Faculty Mentor",
    authorRole: "FACULTY",
    title: "Google Developer Student Club (GDSC) — Cloud Computing & AI Workshop",
    summary: "Hands-on session on Google Cloud Vertex AI, Kubernetes engine deployment, and serverless architectures.",
    content: `### GDSC Hands-on Masterclass

Join us for a 4-hour immersive workshop on developing modern AI microservices.

**Venue:** Advanced Computing Center, Room 402  
**Date:** Saturday, March 15, 2025 (10:00 AM – 2:00 PM)

Participants will build and deploy a real-time retrieval-augmented chatbot using Python, FastAPI, and Cloud Run. Free Google Cloud credits will be provided to all attendees.`,
    category: NoticeCategory.CLUB,
    priority: NoticePriority.NORMAL,
    audience: NoticeAudience.STUDENTS,
    departmentId: "dept-comp",
    departmentName: "Computer Engineering",
    status: NoticeStatus.PUBLISHED,
    publishDate: "2025-03-06T15:00:00.000Z",
    expiryDate: "2025-03-16T23:59:59.000Z",
    attachmentUrl: "/downloads/GDSC_Cloud_Workshop_Brochure.pdf",
    isPublished: true,
    attachments: [
      {
        id: "att-005",
        noticeId: "notice-005",
        fileName: "GDSC_Cloud_Workshop_Brochure.pdf",
        fileUrl: "/downloads/GDSC_Cloud_Workshop_Brochure.pdf",
        fileType: "application/pdf",
        fileSize: 1153433,
        uploadedAt: "2025-03-06T15:00:00.000Z",
      },
    ],
    reads: [], // Unread
    createdAt: "2025-03-06T14:30:00.000Z",
    updatedAt: "2025-03-06T15:00:00.000Z",
  },
  {
    id: "notice-006",
    authorId: "demo-admin-001",
    authorName: "Registrar Secretariat",
    authorRole: "ADMIN",
    title: "National Holiday Declaration — Mahashivratri Campus Closure",
    summary: "Academic departments, libraries, and administrative offices will observe complete holiday tomorrow.",
    content: `### Campus Holiday Notice

All students, teaching faculty, and administrative staff are notified that the University campus will remain closed on **Wednesday, March 8, 2025**, on the auspicious occasion of Mahashivratri.

Regular lectures, practical sessions, and laboratory slots will resume as per timetable on Thursday. Emergency clinic and essential security operations remain operational.`,
    category: NoticeCategory.HOLIDAY,
    priority: NoticePriority.NORMAL,
    audience: NoticeAudience.ALL,
    status: NoticeStatus.PUBLISHED,
    publishDate: "2025-03-07T09:00:00.000Z",
    expiryDate: "2025-03-09T23:59:59.000Z",
    attachmentUrl: null,
    isPublished: true,
    attachments: [],
    reads: [
      {
        id: "read-005",
        noticeId: "notice-006",
        userId: "demo-student-001",
        readAt: "2025-03-07T09:45:00.000Z",
      },
    ],
    createdAt: "2025-03-07T08:45:00.000Z",
    updatedAt: "2025-03-07T09:00:00.000Z",
  },
  {
    id: "notice-007",
    authorId: "demo-admin-001",
    authorName: "IT Infrastructure & Security Operations",
    authorRole: "ADMIN",
    title: "Urgent: Core Network & High-Performance Cluster Maintenance Window",
    summary: "Campus optical fiber switches and datacenter hypervisors will undergo critical firmware patching this Saturday evening.",
    content: `### Urgent IT Infrastructure Maintenance Notice

Please be advised that the central datacenter will be performing critical kernel upgrades and optical switch firmware updates on **Saturday, March 15, between 11:00 PM and 04:00 AM IST**.

#### Impact:
- Campus Wi-Fi (CampusSphere-Secure) and Ethernet ports will experience periodic dropouts.
- High-Performance GPU clusters (HPC-1 through HPC-4) will be powered off.
- Please save all running jobs and git commits prior to the maintenance window.`,
    category: NoticeCategory.URGENT,
    priority: NoticePriority.URGENT,
    audience: NoticeAudience.ALL,
    status: NoticeStatus.PUBLISHED,
    publishDate: "2025-03-08T11:00:00.000Z",
    expiryDate: "2025-03-16T23:59:59.000Z",
    attachmentUrl: null,
    isPublished: true,
    attachments: [],
    reads: [], // Unread
    createdAt: "2025-03-08T10:45:00.000Z",
    updatedAt: "2025-03-08T11:00:00.000Z",
  },
  {
    id: "notice-008",
    authorId: "demo-faculty-001",
    authorName: "Dr. Ramesh Sharma, Project Coordinator",
    authorRole: "FACULTY",
    title: "Submission of Semester 6 Capstone Project Progress Report (Milestone 2)",
    summary: "All Semester 6 Computer Engineering candidates must submit their architectural blueprints and intermediate Git commits by Monday.",
    content: `### Capstone Milestone 2 Guidelines

Students registered for CS609 Capstone Phase 1 must present their Milestone 2 deliverables to their respective panel guides.

#### Required Deliverables:
1. High-level architecture diagram and relational database schema.
2. Verified unit test reports with at least 70% coverage.
3. Live functional demonstration on local staging environments.

Penalties of 10% per day will apply for late submissions without approved medical leaves.`,
    category: NoticeCategory.ACADEMIC,
    priority: NoticePriority.IMPORTANT,
    audience: NoticeAudience.SEMESTER,
    departmentId: "dept-comp",
    departmentName: "Computer Engineering",
    semester: 6,
    status: NoticeStatus.PUBLISHED,
    publishDate: "2025-03-09T08:30:00.000Z",
    expiryDate: "2025-03-24T23:59:59.000Z",
    attachmentUrl: "/downloads/Capstone_Milestone2_Rubrics.pdf",
    isPublished: true,
    attachments: [
      {
        id: "att-006",
        noticeId: "notice-008",
        fileName: "Capstone_Milestone2_Rubrics.pdf",
        fileUrl: "/downloads/Capstone_Milestone2_Rubrics.pdf",
        fileType: "application/pdf",
        fileSize: 655360,
        uploadedAt: "2025-03-09T08:30:00.000Z",
      },
    ],
    reads: [], // Unread
    createdAt: "2025-03-09T08:00:00.000Z",
    updatedAt: "2025-03-09T08:30:00.000Z",
  },
  {
    id: "notice-009",
    authorId: "demo-faculty-001",
    authorName: "Dr. Ramesh Sharma",
    authorRole: "FACULTY",
    title: "Division A Special Lab Session on Distributed Transaction Protocols",
    summary: "Mandatory hands-on lab in Room C-402 regarding Two-Phase Commit and Paxos consensus implementations.",
    content: `### Special Laboratory Session: Division A

All students of TE Computer Engineering **Division A** must attend an extended lab session on Thursday at 2:00 PM.

We will simulate network partitions, split-brain syndromes, and crash recovery using Dockerized PostgreSQL nodes and Raft consensus engines. Please bring your configured development laptops.`,
    category: NoticeCategory.ACADEMIC,
    priority: NoticePriority.NORMAL,
    audience: NoticeAudience.DIVISION,
    departmentId: "dept-comp",
    departmentName: "Computer Engineering",
    divisionId: "div-comp-a",
    divisionName: "Division A",
    semester: 6,
    status: NoticeStatus.PUBLISHED,
    publishDate: "2025-03-10T09:15:00.000Z",
    expiryDate: "2025-03-20T23:59:59.000Z",
    attachmentUrl: null,
    isPublished: true,
    attachments: [],
    reads: [], // Unread
    createdAt: "2025-03-10T09:00:00.000Z",
    updatedAt: "2025-03-10T09:15:00.000Z",
  },
  {
    id: "notice-010",
    authorId: "demo-admin-001",
    authorName: "Dean of Academics",
    authorRole: "ADMIN",
    title: "Faculty Board of Studies Meeting — Curriculum Modernization for AI/ML Electives",
    summary: "All engineering faculty members are invited to review proposed syllabus revisions for the 2025-2026 academic cycle.",
    content: `### Academic Board of Studies Circular

A special session of the Faculty Board of Studies will be convened in the Senate Hall on Friday, March 21 at 3:30 PM.

#### Key Agenda Items:
- Introducing GenAI and LLM Systems Architecture as core electives.
- Revision of practical laboratory hours for cloud engineering tracks.
- Adoption of continuous automated code assessment platforms.`,
    category: NoticeCategory.ADMINISTRATIVE,
    priority: NoticePriority.IMPORTANT,
    audience: NoticeAudience.FACULTY,
    status: NoticeStatus.PUBLISHED,
    publishDate: "2025-03-10T12:00:00.000Z",
    expiryDate: "2025-03-22T23:59:59.000Z",
    attachmentUrl: "/downloads/Board_Of_Studies_Agenda_2025.pdf",
    isPublished: true,
    attachments: [
      {
        id: "att-007",
        noticeId: "notice-010",
        fileName: "Board_Of_Studies_Agenda_2025.pdf",
        fileUrl: "/downloads/Board_Of_Studies_Agenda_2025.pdf",
        fileType: "application/pdf",
        fileSize: 1843200,
        uploadedAt: "2025-03-10T12:00:00.000Z",
      },
    ],
    reads: [
      {
        id: "read-006",
        noticeId: "notice-010",
        userId: "demo-faculty-001",
        readAt: "2025-03-10T13:00:00.000Z",
      },
    ],
    createdAt: "2025-03-10T11:30:00.000Z",
    updatedAt: "2025-03-10T12:00:00.000Z",
  },
  {
    id: "notice-011",
    authorId: "demo-faculty-001",
    authorName: "Dr. Ramesh Sharma",
    authorRole: "FACULTY",
    title: "Draft: Proposed Revision to Academic Calendar 2025-2026",
    summary: "Internal draft outlining tentative dates for end-semester assessments, winter vacations, and re-examinations.",
    content: `### Internal Faculty Working Draft: Academic Calendar 2025-2026

This is an unapproved working draft circulated among department chairs.
Tentative term start: July 15, 2025.
Tentative mid-term assessments: September 22 to September 29, 2025.`,
    category: NoticeCategory.ADMINISTRATIVE,
    priority: NoticePriority.NORMAL,
    audience: NoticeAudience.FACULTY,
    status: NoticeStatus.DRAFT,
    publishDate: "2025-03-11T10:00:00.000Z",
    expiryDate: null,
    attachmentUrl: null,
    isPublished: false,
    attachments: [],
    reads: [],
    createdAt: "2025-03-11T09:30:00.000Z",
    updatedAt: "2025-03-11T10:00:00.000Z",
  },
  {
    id: "notice-012",
    authorId: "demo-admin-001",
    authorName: "Academic Integrity Committee",
    authorRole: "ADMIN",
    title: "Draft: Institutional Policy on AI Assistant Tools in Programming Assessments",
    summary: "Draft advisory regarding acceptable usage guidelines for generative AI tools during lab coursework.",
    content: `### Draft Policy on Generative AI Utilization

Draft document under review by the Senate. Proposes guidelines distinguishing between code completion tools and uncredited AI submissions in graded laboratory assignments.`,
    category: NoticeCategory.ACADEMIC,
    priority: NoticePriority.NORMAL,
    audience: NoticeAudience.ALL,
    status: NoticeStatus.DRAFT,
    publishDate: "2025-03-11T11:00:00.000Z",
    expiryDate: null,
    attachmentUrl: null,
    isPublished: false,
    attachments: [],
    reads: [],
    createdAt: "2025-03-11T10:45:00.000Z",
    updatedAt: "2025-03-11T11:00:00.000Z",
  },
  {
    id: "notice-013",
    authorId: "demo-admin-001",
    authorName: "Examination Cell",
    authorRole: "ADMIN",
    title: "Expired: Fall 2024 End-Semester Hall Ticket Distribution",
    summary: "Physical hall tickets collection schedule at academic counter for December 2024 examinations.",
    content: `### End-Semester Hall Ticket Collection Notice (Archived Cycle)

All eligible students must collect their verified physical hall ticket from the student counter before December 10, 2024.`,
    category: NoticeCategory.EXAMINATION,
    priority: NoticePriority.NORMAL,
    audience: NoticeAudience.STUDENTS,
    status: NoticeStatus.EXPIRED,
    publishDate: "2024-11-25T09:00:00.000Z",
    expiryDate: "2024-12-15T23:59:59.000Z",
    attachmentUrl: null,
    isPublished: true,
    attachments: [],
    reads: [
      {
        id: "read-007",
        noticeId: "notice-013",
        userId: "demo-student-001",
        readAt: "2024-11-26T10:00:00.000Z",
      },
    ],
    createdAt: "2024-11-25T08:30:00.000Z",
    updatedAt: "2024-11-25T09:00:00.000Z",
  },
  {
    id: "notice-014",
    authorId: "demo-admin-001",
    authorName: "Hostel Warden Office",
    authorRole: "ADMIN",
    title: "Archived: Emergency Water Supply Maintenance Notice — North Hostel Wing",
    summary: "Temporary utility disruption for plumbing repairs successfully completed in November 2024.",
    content: `Water supply lines have been fully restored after valve replacement work in the North Hostel wing. Thank you for your cooperation.`,
    category: NoticeCategory.GENERAL,
    priority: NoticePriority.NORMAL,
    audience: NoticeAudience.ALL,
    status: NoticeStatus.ARCHIVED,
    publishDate: "2024-11-10T08:00:00.000Z",
    expiryDate: "2024-11-12T23:59:59.000Z",
    attachmentUrl: null,
    isPublished: true,
    attachments: [],
    reads: [],
    createdAt: "2024-11-10T07:45:00.000Z",
    updatedAt: "2024-11-12T18:00:00.000Z",
  },
  {
    id: "notice-015",
    authorId: "demo-admin-001",
    authorName: "Department of Mechanical Engineering",
    authorRole: "ADMIN",
    title: "Mechanical Engineering Departmental Seminar on Additive Manufacturing",
    summary: "Invited guest lecture exclusively for Mechanical Engineering students in Auditorium B.",
    content: `### Departmental Seminar on Advanced 3D Printing & Metallic Alloys

Keynote presentation by Dr. K. K. Verma, Lead Scientist at BARC. Exclusively for students enrolled in the Mechanical Engineering Department.`,
    category: NoticeCategory.ACADEMIC,
    priority: NoticePriority.NORMAL,
    audience: NoticeAudience.DEPARTMENT,
    departmentId: "dept-mech",
    departmentName: "Mechanical Engineering",
    status: NoticeStatus.PUBLISHED,
    publishDate: "2025-03-08T14:00:00.000Z",
    expiryDate: "2025-03-28T23:59:59.000Z",
    attachmentUrl: null,
    isPublished: true,
    attachments: [],
    reads: [],
    createdAt: "2025-03-08T13:30:00.000Z",
    updatedAt: "2025-03-08T14:00:00.000Z",
  },
  {
    id: "notice-016",
    authorId: "demo-faculty-001",
    authorName: "Dr. Ramesh Sharma",
    authorRole: "FACULTY",
    title: "Division B Advance Notice: Computer Graphics Project Viva Schedule",
    summary: "Oral evaluation and viva slot allocations for Division B candidates only.",
    content: `### Oral Examination Schedule for Division B Candidates

Division B candidates are assigned viva slots according to roll numbers. Room 302, starting 9:00 AM on Monday.`,
    category: NoticeCategory.ACADEMIC,
    priority: NoticePriority.NORMAL,
    audience: NoticeAudience.DIVISION,
    departmentId: "dept-comp",
    departmentName: "Computer Engineering",
    divisionId: "div-comp-b",
    divisionName: "Division B",
    semester: 6,
    status: NoticeStatus.PUBLISHED,
    publishDate: "2025-03-09T16:00:00.000Z",
    expiryDate: "2025-03-26T23:59:59.000Z",
    attachmentUrl: null,
    isPublished: true,
    attachments: [],
    reads: [],
    createdAt: "2025-03-09T15:30:00.000Z",
    updatedAt: "2025-03-09T16:00:00.000Z",
  },
];

// In-memory store for tests, live execution, and offline resilience
export const DEMO_NOTICES_STORE: DemoNotice[] = JSON.parse(JSON.stringify(INITIAL_DEMO_NOTICES));

export function resetDemoNoticesStore() {
  DEMO_NOTICES_STORE.length = 0;
  DEMO_NOTICES_STORE.push(...JSON.parse(JSON.stringify(INITIAL_DEMO_NOTICES)));
}
