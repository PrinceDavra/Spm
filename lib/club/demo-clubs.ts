import {
  ClubCategory,
  ClubStatus,
  MembershipRole,
  MembershipStatus,
  ClubActivityType,
} from "@prisma/client";

export interface DemoClubMembership {
  id: string;
  clubId: string;
  userId: string;
  studentId: string;
  userName: string;
  userEmail: string;
  rollNumber: string;
  departmentName: string;
  semester: number;
  role: MembershipRole;
  status: MembershipStatus;
  appliedAt: string;
  joinedAt?: string | null;
  approvedAt?: string | null;
  approvedBy?: string | null;
  leftAt?: string | null;
}

export interface DemoClubActivity {
  id: string;
  clubId: string;
  title: string;
  description: string;
  activityDate: string;
  activityType: ClubActivityType;
  venue?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DemoClub {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  category: ClubCategory;
  status: ClubStatus;
  departmentId?: string | null;
  departmentName?: string | null;
  facultyAdvisorId?: string | null;
  facultyAdvisorName?: string | null;
  coordinatorId?: string | null;
  coordinatorName?: string | null;
  logoUrl: string;
  bannerUrl: string;
  contactEmail: string;
  contactPhone?: string | null;
  establishedYear: number;
  isRecruiting: boolean;
  memberships: DemoClubMembership[];
  activities: DemoClubActivity[];
  linkedEventIds: string[];
  createdAt: string;
  updatedAt: string;
}

export const INITIAL_DEMO_CLUBS: DemoClub[] = [
  {
    id: "club-001",
    name: "Coding & Robotics Club",
    slug: "coding-robotics-club",
    shortDescription: "Premier engineering society fostering competitive programming, autonomous robotics, and open-source innovation.",
    description: `### Welcome to the Coding & Robotics Club (CRC)
The flagship technology collective at CampusSphere. We are an interdisciplinary community of programmers, hardware hackers, and autonomous systems builders.

#### Core Pillars:
1. **Algorithmic Mastery** — Weekly ACM-ICPC and Codeforces training sessions.
2. **Autonomous Hardware** — ROS, Arduino, micro-controller circuits, and robotic battle-bots.
3. **Open-Source Engineering** — Building campus tools and contributing to global repositories.

#### Regular Schedule:
- **Tuesdays 05:00 PM**: Competitive Programming Contest Review (Lab 301)
- **Thursdays 05:30 PM**: Embedded Robotics Workshop (Hardware Lab Block A)
- **Alternate Saturdays**: 12-Hour Sprint & Project Showcase`,
    category: ClubCategory.TECHNICAL,
    status: ClubStatus.ACTIVE,
    departmentId: "dept-cs-01",
    departmentName: "Computer Engineering",
    facultyAdvisorId: "demo-faculty-001",
    facultyAdvisorName: "Prof. Meera Sen (Associate Professor)",
    coordinatorId: "demo-club-001",
    coordinatorName: "Ananya Deshmukh",
    logoUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=300&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&q=80",
    contactEmail: "crc@campussphere.edu",
    contactPhone: "+91 97654 32109",
    establishedYear: 2018,
    isRecruiting: true,
    linkedEventIds: ["evt-001", "evt-002"],
    createdAt: "2026-01-10T10:00:00.000Z",
    updatedAt: "2026-09-01T12:00:00.000Z",
    memberships: [
      {
        id: "mem-001-01",
        clubId: "club-001",
        userId: "demo-club-001",
        studentId: "STU-2022-0099",
        userName: "Ananya Deshmukh",
        userEmail: "club@campussphere.edu",
        rollNumber: "22IT045",
        departmentName: "Information Technology",
        semester: 6,
        role: MembershipRole.COORDINATOR,
        status: MembershipStatus.ACTIVE,
        appliedAt: "2026-01-10T10:00:00.000Z",
        joinedAt: "2026-01-10T10:00:00.000Z",
        approvedAt: "2026-01-10T10:00:00.000Z",
        approvedBy: "demo-admin-001",
      },
      {
        id: "mem-001-02",
        clubId: "club-001",
        userId: "demo-faculty-001",
        studentId: "FAC-2018-042",
        userName: "Prof. Meera Sen",
        userEmail: "faculty@campussphere.edu",
        rollNumber: "FACULTY",
        departmentName: "Computer Engineering",
        semester: 0,
        role: MembershipRole.FACULTY_ADVISOR,
        status: MembershipStatus.ACTIVE,
        appliedAt: "2026-01-10T10:00:00.000Z",
        joinedAt: "2026-01-10T10:00:00.000Z",
        approvedAt: "2026-01-10T10:00:00.000Z",
        approvedBy: "demo-admin-001",
      },
      {
        id: "mem-001-03",
        clubId: "club-001",
        userId: "demo-student-001",
        studentId: "STU-2022-0101",
        userName: "Aarav Mehta",
        userEmail: "student@campussphere.edu",
        rollNumber: "22COMPA101",
        departmentName: "Computer Engineering",
        semester: 6,
        role: MembershipRole.MEMBER,
        status: MembershipStatus.ACTIVE,
        appliedAt: "2026-01-15T11:00:00.000Z",
        joinedAt: "2026-01-16T09:30:00.000Z",
        approvedAt: "2026-01-16T09:30:00.000Z",
        approvedBy: "demo-club-001",
      },
      {
        id: "mem-001-04",
        clubId: "club-001",
        userId: "user-stu-002",
        studentId: "STU-2022-0102",
        userName: "Priya Nair",
        userEmail: "priya.nair@campussphere.edu",
        rollNumber: "22COMPA102",
        departmentName: "Computer Engineering",
        semester: 6,
        role: MembershipRole.CORE_MEMBER,
        status: MembershipStatus.ACTIVE,
        appliedAt: "2026-01-18T14:00:00.000Z",
        joinedAt: "2026-01-19T10:00:00.000Z",
        approvedAt: "2026-01-19T10:00:00.000Z",
        approvedBy: "demo-club-001",
      },
      {
        id: "mem-001-05",
        clubId: "club-001",
        userId: "user-stu-005",
        studentId: "STU-2023-0205",
        userName: "Vikram Malhotra",
        userEmail: "vikram.m@campussphere.edu",
        rollNumber: "23COMPB205",
        departmentName: "Computer Engineering",
        semester: 4,
        role: MembershipRole.MEMBER,
        status: MembershipStatus.PENDING,
        appliedAt: "2026-09-10T15:20:00.000Z",
      },
      {
        id: "mem-001-06",
        clubId: "club-001",
        userId: "user-stu-006",
        studentId: "STU-2023-0206",
        userName: "Neha Sharma",
        userEmail: "neha.sharma@campussphere.edu",
        rollNumber: "23COMPB206",
        departmentName: "Computer Engineering",
        semester: 4,
        role: MembershipRole.MEMBER,
        status: MembershipStatus.PENDING,
        appliedAt: "2026-09-11T12:00:00.000Z",
      },
    ],
    activities: [
      {
        id: "act-001-01",
        clubId: "club-001",
        title: "Weekly Competitive Programming Sprint & Dynamic Programming Lab",
        description: "Solving Hard DP with bitmasking and tree queries. Mentor feedback on time complexity optimization.",
        activityDate: "2026-09-18T17:00:00.000Z",
        activityType: ClubActivityType.WORKSHOP,
        venue: "Computer Center Lab 301",
        createdBy: "demo-club-001",
        createdAt: "2026-09-01T10:00:00.000Z",
        updatedAt: "2026-09-01T10:00:00.000Z",
      },
      {
        id: "act-001-02",
        clubId: "club-001",
        title: "Autonomous Quadcopter PID Tuning & Sensor Calibration",
        description: "Hands-on lab configuring gyro filters, optical flow sensors, and telemetry communication.",
        activityDate: "2026-09-22T16:30:00.000Z",
        activityType: ClubActivityType.PRACTICE,
        venue: "Hardware & Robotics Arena",
        createdBy: "demo-club-001",
        createdAt: "2026-09-03T11:00:00.000Z",
        updatedAt: "2026-09-03T11:00:00.000Z",
      },
      {
        id: "act-001-03",
        clubId: "club-001",
        title: "Executive Core Committee Planning Meeting for Hackathon 2026",
        description: "Reviewing track judging criteria, logistics, volunteer team assignments, and sponsor booths.",
        activityDate: "2026-09-25T18:00:00.000Z",
        activityType: ClubActivityType.MEETING,
        venue: "Innovation Hub Conference Room",
        createdBy: "demo-club-001",
        createdAt: "2026-09-05T09:00:00.000Z",
        updatedAt: "2026-09-05T09:00:00.000Z",
      },
    ],
  },
  {
    id: "club-002",
    name: "AI & Machine Learning Society",
    slug: "ai-ml-society",
    shortDescription: "Exploring Large Language Models, deep reinforcement learning, computer vision, and neural network research.",
    description: `### AI & Machine Learning Society (AIMS)
A research and project-focused student collective exploring the frontiers of artificial intelligence, model distillation, and multimodal reasoning.`,
    category: ClubCategory.TECHNICAL,
    status: ClubStatus.ACTIVE,
    departmentId: "dept-cs-01",
    departmentName: "Computer Engineering",
    facultyAdvisorId: "demo-faculty-001",
    facultyAdvisorName: "Prof. Meera Sen",
    coordinatorId: "user-stu-002",
    coordinatorName: "Priya Nair",
    logoUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=300&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1677442136019-21780efad99a?w=1200&q=80",
    contactEmail: "aims@campussphere.edu",
    contactPhone: "+91 97654 32110",
    establishedYear: 2021,
    isRecruiting: true,
    linkedEventIds: ["evt-002"],
    createdAt: "2026-01-12T10:00:00.000Z",
    updatedAt: "2026-09-02T12:00:00.000Z",
    memberships: [
      {
        id: "mem-002-01",
        clubId: "club-002",
        userId: "user-stu-002",
        studentId: "STU-2022-0102",
        userName: "Priya Nair",
        userEmail: "priya.nair@campussphere.edu",
        rollNumber: "22COMPA102",
        departmentName: "Computer Engineering",
        semester: 6,
        role: MembershipRole.COORDINATOR,
        status: MembershipStatus.ACTIVE,
        appliedAt: "2026-01-12T10:00:00.000Z",
        joinedAt: "2026-01-12T10:00:00.000Z",
        approvedAt: "2026-01-12T10:00:00.000Z",
        approvedBy: "demo-admin-001",
      },
      {
        id: "mem-002-02",
        clubId: "club-002",
        userId: "demo-student-001",
        studentId: "STU-2022-0101",
        userName: "Aarav Mehta",
        userEmail: "student@campussphere.edu",
        rollNumber: "22COMPA101",
        departmentName: "Computer Engineering",
        semester: 6,
        role: MembershipRole.MEMBER,
        status: MembershipStatus.PENDING,
        appliedAt: "2026-09-12T10:00:00.000Z",
      },
    ],
    activities: [
      {
        id: "act-002-01",
        clubId: "club-002",
        title: "Paper Reading: FlashAttention-3 & Transformer Inference Speedups",
        description: "Deep dive into GPU SRAM tiling, memory coalescing, and IO-aware algorithm design.",
        activityDate: "2026-09-20T17:00:00.000Z",
        activityType: ClubActivityType.WORKSHOP,
        venue: "Seminar Room 204",
        createdBy: "user-stu-002",
        createdAt: "2026-09-02T10:00:00.000Z",
        updatedAt: "2026-09-02T10:00:00.000Z",
      },
    ],
  },
  {
    id: "club-003",
    name: "UI/UX & Product Design Guild",
    slug: "design-guild",
    shortDescription: "Design systems, human-computer interaction, Figma prototyping, and user psychology.",
    description: `### UI/UX & Product Design Guild
Crafting intuitive digital experiences. We bridge the gap between aesthetic design and engineering execution.`,
    category: ClubCategory.DESIGN,
    status: ClubStatus.ACTIVE,
    departmentId: "dept-cs-01",
    departmentName: "Computer Engineering",
    coordinatorId: "user-stu-003",
    coordinatorName: "Rohan Varma",
    logoUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=300&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=1200&q=80",
    contactEmail: "design@campussphere.edu",
    establishedYear: 2022,
    isRecruiting: true,
    linkedEventIds: ["evt-011"],
    createdAt: "2026-02-01T10:00:00.000Z",
    updatedAt: "2026-09-01T12:00:00.000Z",
    memberships: [
      {
        id: "mem-003-01",
        clubId: "club-003",
        userId: "user-stu-003",
        studentId: "STU-2022-0103",
        userName: "Rohan Varma",
        userEmail: "rohan.varma@campussphere.edu",
        rollNumber: "22COMPA103",
        departmentName: "Computer Engineering",
        semester: 6,
        role: MembershipRole.COORDINATOR,
        status: MembershipStatus.ACTIVE,
        appliedAt: "2026-02-01T10:00:00.000Z",
        joinedAt: "2026-02-01T10:00:00.000Z",
        approvedAt: "2026-02-01T10:00:00.000Z",
        approvedBy: "demo-admin-001",
      },
    ],
    activities: [],
  },
  {
    id: "club-004",
    name: "Entrepreneurship & Venture Cell (E-Cell)",
    slug: "e-cell",
    shortDescription: "Incubating student ventures, pitch competitions, founder masterclasses, and angel network access.",
    description: `### Entrepreneurship & Venture Cell
Empowering student founders from ideation to seed funding and university incubator grants.`,
    category: ClubCategory.ENTREPRENEURSHIP,
    status: ClubStatus.ACTIVE,
    coordinatorId: "demo-placement-001",
    coordinatorName: "Vikramaditya Nair",
    logoUrl: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=300&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&q=80",
    contactEmail: "ecell@campussphere.edu",
    establishedYear: 2017,
    isRecruiting: true,
    linkedEventIds: [],
    createdAt: "2026-01-05T10:00:00.000Z",
    updatedAt: "2026-09-01T12:00:00.000Z",
    memberships: [],
    activities: [],
  },
  {
    id: "club-005",
    name: "Tarangini Cultural & Dramatic Arts Society",
    slug: "tarangini-cultural-society",
    shortDescription: "Theater production, classical & contemporary dance, street plays, and annual campus gala orchestration.",
    description: `### Tarangini Cultural Society
The beating heart of campus artistic life. From street drama to stage productions and musical orchestration.`,
    category: ClubCategory.CULTURAL,
    status: ClubStatus.ACTIVE,
    logoUrl: "https://images.unsplash.com/photo-1469488865564-c2de10f69f96?w=300&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80",
    contactEmail: "cultural@campussphere.edu",
    establishedYear: 2016,
    isRecruiting: true,
    linkedEventIds: ["evt-004"],
    createdAt: "2026-01-05T10:00:00.000Z",
    updatedAt: "2026-09-01T12:00:00.000Z",
    memberships: [],
    activities: [],
  },
  {
    id: "club-006",
    name: "Literary & Debating Society (LitSoc)",
    slug: "litsoc-debating-society",
    shortDescription: "Parliamentary debating, Model United Nations (MUN), creative writing, and poetry slams.",
    description: `### Literary & Debating Society
Fostering critical discourse, eloquence, policy debates, and campus journalism.`,
    category: ClubCategory.LITERARY,
    status: ClubStatus.ACTIVE,
    logoUrl: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=300&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200&q=80",
    contactEmail: "litsoc@campussphere.edu",
    establishedYear: 2019,
    isRecruiting: true,
    linkedEventIds: [],
    createdAt: "2026-01-08T10:00:00.000Z",
    updatedAt: "2026-09-01T12:00:00.000Z",
    memberships: [],
    activities: [],
  },
  {
    id: "club-007",
    name: "ShutterBug Photography & Visual Arts Club",
    slug: "shutterbug-photography",
    shortDescription: "Cinematography, photojournalism, darkroom techniques, and campus media coverage.",
    description: `### ShutterBug Photography Club
Capturing campus memories, visual storytelling, street photography, and documentary filmmaking.`,
    category: ClubCategory.CULTURAL,
    status: ClubStatus.ACTIVE,
    logoUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1200&q=80",
    contactEmail: "shutterbug@campussphere.edu",
    establishedYear: 2020,
    isRecruiting: true,
    linkedEventIds: [],
    createdAt: "2026-01-15T10:00:00.000Z",
    updatedAt: "2026-09-01T12:00:00.000Z",
    memberships: [],
    activities: [],
  },
  {
    id: "club-008",
    name: "Campus Music & Symphony Collective",
    slug: "campus-music-collective",
    shortDescription: "Acoustic ensembles, rock bands, vocal training, and live acoustic jam nights.",
    description: `### Campus Music & Symphony Collective
Bringing musicians together across genres—from rock and indie to Indian classical and jazz.`,
    category: ClubCategory.CULTURAL,
    status: ClubStatus.ACTIVE,
    logoUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&q=80",
    contactEmail: "music@campussphere.edu",
    establishedYear: 2019,
    isRecruiting: true,
    linkedEventIds: [],
    createdAt: "2026-01-18T10:00:00.000Z",
    updatedAt: "2026-09-01T12:00:00.000Z",
    memberships: [],
    activities: [],
  },
  {
    id: "club-009",
    name: "CyberGuard Security & Ethical Hacking Club",
    slug: "cyberguard-security",
    shortDescription: "Capture The Flag (CTF) tournaments, penetration testing, reverse engineering, and threat intelligence.",
    description: `### CyberGuard Security Club
Defensive and offensive cybersecurity, vulnerability analysis, and zero-day research.`,
    category: ClubCategory.TECHNICAL,
    status: ClubStatus.ACTIVE,
    logoUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=300&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&q=80",
    contactEmail: "cyberguard@campussphere.edu",
    establishedYear: 2021,
    isRecruiting: true,
    linkedEventIds: [],
    createdAt: "2026-02-05T10:00:00.000Z",
    updatedAt: "2026-09-01T12:00:00.000Z",
    memberships: [],
    activities: [],
  },
  {
    id: "club-010",
    name: "Apex Sports & Athletics Club",
    slug: "apex-sports-club",
    shortDescription: "Inter-collegiate leagues in cricket, football, basketball, badminton, and athletic conditioning.",
    description: `### Apex Sports & Athletics
Promoting competitive spirit, teamwork, and athletic excellence through collegiate tournaments.`,
    category: ClubCategory.SPORTS,
    status: ClubStatus.ACTIVE,
    logoUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=300&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&q=80",
    contactEmail: "sports@campussphere.edu",
    establishedYear: 2015,
    isRecruiting: true,
    linkedEventIds: ["evt-005"],
    createdAt: "2026-01-05T10:00:00.000Z",
    updatedAt: "2026-09-01T12:00:00.000Z",
    memberships: [],
    activities: [],
  },
  {
    id: "club-011",
    name: "Social Impact & Community Outreach Society",
    slug: "social-impact-outreach",
    shortDescription: "Rural digital literacy, blood donation camps, environmental cleanups, and NGO partnerships.",
    description: `### Social Impact & Outreach Society
Dedicated to community welfare, sustainability initiatives, and social grassroots volunteering.`,
    category: ClubCategory.SOCIAL,
    status: ClubStatus.ACTIVE,
    logoUrl: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=300&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&q=80",
    contactEmail: "social@campussphere.edu",
    establishedYear: 2018,
    isRecruiting: true,
    linkedEventIds: ["evt-012"],
    createdAt: "2026-01-10T10:00:00.000Z",
    updatedAt: "2026-09-01T12:00:00.000Z",
    memberships: [],
    activities: [],
  },
  {
    id: "club-012",
    name: "Open Source & Linux Developers Guild",
    slug: "open-source-developers",
    shortDescription: "Upstream kernel contributions, Rust, Go, Kubernetes tooling, and FOSS advocacy.",
    description: `### Open Source & Linux Developers Guild
Promoting free and open-source software, upstream contributions, and community-driven development.`,
    category: ClubCategory.CODING,
    status: ClubStatus.ACTIVE,
    logoUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=1200&q=80",
    contactEmail: "foss@campussphere.edu",
    establishedYear: 2020,
    isRecruiting: true,
    linkedEventIds: ["evt-006"],
    createdAt: "2026-02-10T10:00:00.000Z",
    updatedAt: "2026-09-01T12:00:00.000Z",
    memberships: [],
    activities: [],
  },
  {
    id: "club-013",
    name: "BioTech & Health Sciences Forum",
    slug: "biotech-health-forum",
    shortDescription: "Draft proposal: Bioinformatics, CRISPR research discussions, and medical hardware.",
    description: `### BioTech & Health Sciences Forum (Draft)
New interdisciplinary initiative under academic review. Not yet open for student recruitment.`,
    category: ClubCategory.OTHER,
    status: ClubStatus.DRAFT,
    logoUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=300&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=1200&q=80",
    contactEmail: "biotech@campussphere.edu",
    establishedYear: 2026,
    isRecruiting: false,
    linkedEventIds: [],
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-01T10:00:00.000Z",
    memberships: [],
    activities: [],
  },
  {
    id: "club-014",
    name: "AeroSpace & Rocketry Society",
    slug: "aerospace-rocketry",
    shortDescription: "Currently suspended pending safety committee review of solid-propellant test procedures.",
    description: `### AeroSpace & Rocketry Society (Suspended)
Operations temporarily paused pending institutional lab safety audit. Join requests disabled.`,
    category: ClubCategory.OTHER,
    status: ClubStatus.SUSPENDED,
    logoUrl: "https://images.unsplash.com/photo-1517976487522-d04b77f95015?w=300&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80",
    contactEmail: "aerospace@campussphere.edu",
    establishedYear: 2022,
    isRecruiting: false,
    linkedEventIds: [],
    createdAt: "2026-03-01T10:00:00.000Z",
    updatedAt: "2026-08-15T10:00:00.000Z",
    memberships: [],
    activities: [],
  },
];

// Persistent demo store
export let DEMO_CLUBS_STORE: DemoClub[] = JSON.parse(JSON.stringify(INITIAL_DEMO_CLUBS));

export function resetDemoClubsStore() {
  DEMO_CLUBS_STORE = JSON.parse(JSON.stringify(INITIAL_DEMO_CLUBS));
}
