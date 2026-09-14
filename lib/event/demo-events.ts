import { EventCategory, EventStatus, EventAttendanceStatus, RegistrationStatus } from "@prisma/client";

export interface DemoEventRegistration {
  id: string;
  eventId: string;
  userId: string;
  studentId: string;
  userName: string;
  userEmail: string;
  rollNumber: string;
  departmentName: string;
  semester: number;
  confirmationCode: string;
  registeredAt: string;
  status: RegistrationStatus;
  attendanceStatus: EventAttendanceStatus;
  attendedAt?: string | null;
  markedBy?: string | null;
  cancelledAt?: string | null;
}

export interface DemoEvent {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  category: EventCategory;
  status: EventStatus;
  organizerId: string;
  organizerName: string;
  organizerRole: string;
  venue: string;
  eventDate: string;
  startDateTime: string;
  endDateTime: string;
  registrationOpenAt: string;
  registrationDeadline: string;
  capacity: number;
  posterUrl: string;
  isPublished: boolean;
  registrations: DemoEventRegistration[];
  createdAt: string;
  updatedAt: string;
}

export const INITIAL_DEMO_EVENTS: DemoEvent[] = [
  {
    id: "evt-001",
    slug: "hackathon-2026",
    title: "CampusSphere 36-Hour National Hackathon 2026",
    summary: "Annual inter-college 36-hour hackathon focused on AI, Decentralized Systems, and Smart Campus Infrastructure.",
    description: `### Welcome to Hackathon 2026!
Join over 250 elite student developers, designers, and innovators building next-generation applications.

#### Tracks:
1. **Agentic AI & LLMs** — Autonomous agents, reasoning architectures, and campus automation.
2. **FinTech & Web3** — Micro-payments, zero-knowledge verification, and credential wallets.
3. **Smart Campus Ecosystems** — Sensor IoT, energy grids, and digital student life.

#### Schedule:
- **Day 1, 09:00 AM**: Opening Ceremony & Keynote Speech
- **Day 1, 10:30 AM**: Hacking Commences
- **Day 2, 02:00 PM**: Mentor Mentoring & Mid-way Checkpoint
- **Day 2, 09:00 PM**: Final Code Freeze & Pitch Presentations

Prizes worth **INR 2,50,000**, incubation opportunities, and on-the-spot technical internship interviews!`,
    category: EventCategory.HACKATHON,
    status: EventStatus.REGISTRATION_OPEN,
    organizerId: "demo-club-001",
    organizerName: "Ananya Deshmukh (Coding & Robotics Club Lead)",
    organizerRole: "CLUB_COORDINATOR",
    venue: "Main Campus Auditorium & Innovation Labs (Block A)",
    eventDate: "2026-10-15T09:00:00.000Z",
    startDateTime: "2026-10-15T09:00:00.000Z",
    endDateTime: "2026-10-16T21:00:00.000Z",
    registrationOpenAt: "2026-09-01T00:00:00.000Z",
    registrationDeadline: "2026-10-12T23:59:59.000Z",
    capacity: 100,
    posterUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&q=80",
    isPublished: true,
    registrations: [
      {
        id: "reg-001-01",
        eventId: "evt-001",
        userId: "demo-student-001",
        studentId: "STU-2022-0101",
        userName: "Aarav Mehta",
        userEmail: "student@campussphere.edu",
        rollNumber: "22COMPA101",
        departmentName: "Computer Engineering",
        semester: 6,
        confirmationCode: "CS-HACK-0101A",
        registeredAt: "2026-09-05T11:20:00.000Z",
        status: RegistrationStatus.REGISTERED,
        attendanceStatus: EventAttendanceStatus.UNMARKED,
      },
      {
        id: "reg-001-02",
        eventId: "evt-001",
        userId: "demo-student-002",
        studentId: "STU-2022-0102",
        userName: "Priya Nair",
        userEmail: "priya.nair@campussphere.edu",
        rollNumber: "22COMPA102",
        departmentName: "Computer Engineering",
        semester: 6,
        confirmationCode: "CS-HACK-0102B",
        registeredAt: "2026-09-06T14:15:00.000Z",
        status: RegistrationStatus.REGISTERED,
        attendanceStatus: EventAttendanceStatus.UNMARKED,
      },
      {
        id: "reg-001-03",
        eventId: "evt-001",
        userId: "demo-student-003",
        studentId: "STU-2022-0103",
        userName: "Rohan Varma",
        userEmail: "rohan.varma@campussphere.edu",
        rollNumber: "22COMPA103",
        departmentName: "Computer Engineering",
        semester: 6,
        confirmationCode: "CS-HACK-0103C",
        registeredAt: "2026-09-07T09:40:00.000Z",
        status: RegistrationStatus.REGISTERED,
        attendanceStatus: EventAttendanceStatus.UNMARKED,
      },
    ],
    createdAt: "2026-09-01T08:00:00.000Z",
    updatedAt: "2026-09-08T10:00:00.000Z",
  },
  {
    id: "evt-002",
    slug: "docker-k8s-masterclass",
    title: "Hands-on Masterclass: Docker Containers & Kubernetes Orchestration",
    summary: "Master containerization, pod scheduling, cluster ingress, and production deployment workflows from scratch.",
    description: `### Master Modern Cloud Infrastructure
A 4-hour immersive hands-on technical workshop. Every participant will configure local Docker containers and deploy a multi-tier microservice architecture to a managed Kubernetes cluster.

#### Topics Covered:
- Dockerfile optimization & multi-stage builds
- Container networking, volumes, and secret management
- Kubernetes Deployments, Services, ConfigMaps, and Ingress controllers
- Auto-scaling (HPA) and blue-green rollouts

**Prerequisites:** Bring your laptop with Docker Desktop installed.`,
    category: EventCategory.WORKSHOP,
    status: EventStatus.REGISTRATION_OPEN,
    organizerId: "demo-faculty-001",
    organizerName: "Prof. Meera Sen (Associate Professor)",
    organizerRole: "FACULTY",
    venue: "Lab 302, Advanced Computing Center",
    eventDate: "2026-09-28T14:00:00.000Z",
    startDateTime: "2026-09-28T14:00:00.000Z",
    endDateTime: "2026-09-28T18:00:00.000Z",
    registrationOpenAt: "2026-09-05T00:00:00.000Z",
    registrationDeadline: "2026-09-27T18:00:00.000Z",
    capacity: 40,
    posterUrl: "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=1200&q=80",
    isPublished: true,
    registrations: [
      {
        id: "reg-002-01",
        eventId: "evt-002",
        userId: "demo-student-001",
        studentId: "STU-2022-0101",
        userName: "Aarav Mehta",
        userEmail: "student@campussphere.edu",
        rollNumber: "22COMPA101",
        departmentName: "Computer Engineering",
        semester: 6,
        confirmationCode: "CS-DOCK-8841A",
        registeredAt: "2026-09-06T10:00:00.000Z",
        status: RegistrationStatus.REGISTERED,
        attendanceStatus: EventAttendanceStatus.UNMARKED,
      },
    ],
    createdAt: "2026-09-04T12:00:00.000Z",
    updatedAt: "2026-09-07T11:00:00.000Z",
  },
  {
    id: "evt-003",
    slug: "quantitative-aptitude-cracking",
    title: "Placement Bootcamp: Cracking Technical & Quantitative Aptitude Tests",
    summary: "Intensive screening prep for Tier-1 corporate recruitment drives: speed math, data interpretation, and coding rounds.",
    description: `### Corporate Placement Training Session
Preparing Final & Pre-Final Year engineering students for top-tier IT and financial consulting assessment filters.

#### Highlights:
- Time-saving shortcuts for number theory, permutations & probability
- Graph interpretation and logical puzzles analysis
- Live timed mock test with instant AI-evaluated analytics
- Corporate recruiter perspective by campus placement officers`,
    category: EventCategory.PLACEMENT,
    status: EventStatus.REGISTRATION_OPEN,
    organizerId: "demo-placement-001",
    organizerName: "Vikramaditya Nair (Chief Placement Officer)",
    organizerRole: "PLACEMENT_OFFICER",
    venue: "Seminar Hall 1, Corporate Placement Annex",
    eventDate: "2026-10-02T10:00:00.000Z",
    startDateTime: "2026-10-02T10:00:00.000Z",
    endDateTime: "2026-10-02T13:30:00.000Z",
    registrationOpenAt: "2026-09-08T00:00:00.000Z",
    registrationDeadline: "2026-10-01T20:00:00.000Z",
    capacity: 60,
    posterUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1200&q=80",
    isPublished: true,
    registrations: [
      {
        id: "reg-003-01",
        eventId: "evt-003",
        userId: "demo-student-004",
        studentId: "STU-2022-0104",
        userName: "Kavya Patel",
        userEmail: "kavya.patel@campussphere.edu",
        rollNumber: "22COMPA104",
        departmentName: "Computer Engineering",
        semester: 6,
        confirmationCode: "CS-PLAC-7731K",
        registeredAt: "2026-09-09T08:30:00.000Z",
        status: RegistrationStatus.REGISTERED,
        attendanceStatus: EventAttendanceStatus.UNMARKED,
      },
    ],
    createdAt: "2026-09-05T09:00:00.000Z",
    updatedAt: "2026-09-09T14:00:00.000Z",
  },
  {
    id: "evt-004",
    slug: "annual-cultural-fest-tarang",
    title: "Tarang 2026: Annual Inter-College Cultural Gala & Battle of the Bands",
    summary: "The flagship annual youth festival featuring classical fusion, drama productions, choreography showcases, and rock bands.",
    description: `### The Grandest Campus Cultural Extravaganza
Three spectacular evenings celebrating music, drama, fine arts, and contemporary dance.

#### Segments:
- **Acoustic Unplugged & Western Vocals**
- **Street Play Competition (Nukkad Natak)**
- **Synchronized Group Choreography**
- **Celebrity Guest Performance**

Food trucks, carnival game booths, and photo booths will be active throughout the amphitheater lawns!`,
    category: EventCategory.CULTURAL,
    status: EventStatus.REGISTRATION_OPEN,
    organizerId: "demo-admin-001",
    organizerName: "Office of Student Affairs & Governance",
    organizerRole: "ADMIN",
    venue: "Campus Open Air Amphitheater & Sports Complex",
    eventDate: "2026-11-20T17:00:00.000Z",
    startDateTime: "2026-11-20T17:00:00.000Z",
    endDateTime: "2026-11-22T22:00:00.000Z",
    registrationOpenAt: "2026-09-01T00:00:00.000Z",
    registrationDeadline: "2026-11-18T23:59:59.000Z",
    capacity: 500,
    posterUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80",
    isPublished: true,
    registrations: [],
    createdAt: "2026-08-20T10:00:00.000Z",
    updatedAt: "2026-09-01T12:00:00.000Z",
  },
  {
    id: "evt-005",
    slug: "inter-department-cricket-championship",
    title: "Super Sixes: Inter-Departmental T20 Cricket Tournament",
    summary: "Annual knockout sports league across Engineering, Science, and Management departments.",
    description: `### Annual Campus Sports Championship
Gear up for adrenaline-pumping T20 cricket matches under stadium floodlights.
Full live scoreboards, match telemetry, and certified state umpires.

#### Schedule:
- Group Stages: October 5-8
- Semi-Finals: October 9
- Grand Finale & Trophy Presentation: October 10 (06:00 PM)`,
    category: EventCategory.SPORTS,
    status: EventStatus.REGISTRATION_OPEN,
    organizerId: "demo-admin-001",
    organizerName: "Directorate of Physical Education & Sports",
    organizerRole: "ADMIN",
    venue: "Main University Sports Pavilion Grounds",
    eventDate: "2026-10-05T08:30:00.000Z",
    startDateTime: "2026-10-05T08:30:00.000Z",
    endDateTime: "2026-10-10T21:00:00.000Z",
    registrationOpenAt: "2026-09-01T00:00:00.000Z",
    registrationDeadline: "2026-10-02T18:00:00.000Z",
    capacity: 120,
    posterUrl: "https://images.unsplash.com/photo-1531415074868-036b107e775a?w=1200&q=80",
    isPublished: true,
    registrations: [],
    createdAt: "2026-09-01T08:00:00.000Z",
    updatedAt: "2026-09-06T09:00:00.000Z",
  },
  {
    id: "evt-006",
    slug: "applied-deep-learning-nlp-seminar",
    title: "Distinguished Research Seminar: Frontier Architectures in Generative LLMs",
    summary: "Keynote presentation by visiting research scientist from IISc Bangalore on sparse attention and agent reasoning.",
    description: `### Advanced Artificial Intelligence Seminar
Keynote lecture exploring:
- Transformer quadratic bottleneck & linear attention formulations
- Mixture of Experts (MoE) routing mechanisms
- Reinforcement Learning from Human Feedback (RLHF) vs Direct Preference Optimization (DPO)
- Safe alignment benchmarks in enterprise conversational systems`,
    category: EventCategory.SEMINAR,
    status: EventStatus.REGISTRATION_OPEN,
    organizerId: "demo-faculty-001",
    organizerName: "Prof. Meera Sen (Associate Professor)",
    organizerRole: "FACULTY",
    venue: "Sir M. Visvesvaraya Auditorium, Tech Block B",
    eventDate: "2026-10-18T15:00:00.000Z",
    startDateTime: "2026-10-18T15:00:00.000Z",
    endDateTime: "2026-10-18T17:30:00.000Z",
    registrationOpenAt: "2026-09-10T00:00:00.000Z",
    registrationDeadline: "2026-10-17T18:00:00.000Z",
    capacity: 150,
    posterUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&q=80",
    isPublished: true,
    registrations: [],
    createdAt: "2026-09-08T10:00:00.000Z",
    updatedAt: "2026-09-10T12:00:00.000Z",
  },
  {
    id: "evt-007",
    slug: "competitive-programming-speedrun",
    title: "Algorush 2026: Speed Programming & DSA Contest",
    summary: "Fast-paced 2-hour algorithmic showdown testing complex graph traversal, dynamic programming, and data structures.",
    description: `### Speed, Precision & Optimization
Can you solve 6 challenging competitive programming problems under strict 2-hour limits?
Test your problem-solving against the brightest algorithmic minds on campus.`,
    category: EventCategory.COMPETITION,
    status: EventStatus.REGISTRATION_OPEN,
    organizerId: "demo-club-001",
    organizerName: "Ananya Deshmukh (Coding & Robotics Club Lead)",
    organizerRole: "CLUB_COORDINATOR",
    venue: "Computer Center 1 & 2 (Terminal Cluster)",
    eventDate: "2026-10-08T17:30:00.000Z",
    startDateTime: "2026-10-08T17:30:00.000Z",
    endDateTime: "2026-10-08T20:00:00.000Z",
    registrationOpenAt: "2026-09-01T00:00:00.000Z",
    registrationDeadline: "2026-10-07T23:59:59.000Z",
    capacity: 50,
    posterUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&q=80",
    isPublished: true,
    registrations: [],
    createdAt: "2026-09-02T11:00:00.000Z",
    updatedAt: "2026-09-05T14:00:00.000Z",
  },
  {
    id: "evt-008",
    slug: "open-source-global-contributions",
    title: "Webinar: Getting Started with Global Open Source (GSoC & LFX Mentorship)",
    summary: "Interactive virtual session on navigating GitHub repositories, issue triage, and landing prestigious open-source stipends.",
    description: `### Demystifying Open Source Contribution
Virtual masterclass featuring campus alumni who won Google Summer of Code (GSoC) and Linux Foundation fellowships.
Learn how to read complex codebases, write reproducible unit tests, and interact with upstream maintainers.`,
    category: EventCategory.WEBINAR,
    status: EventStatus.REGISTRATION_OPEN,
    organizerId: "demo-club-001",
    organizerName: "Ananya Deshmukh (Coding & Robotics Club Lead)",
    organizerRole: "CLUB_COORDINATOR",
    venue: "Online Webinar (Google Meet Institutional Stream)",
    eventDate: "2026-09-24T18:30:00.000Z",
    startDateTime: "2026-09-24T18:30:00.000Z",
    endDateTime: "2026-09-24T20:30:00.000Z",
    registrationOpenAt: "2026-09-01T00:00:00.000Z",
    registrationDeadline: "2026-09-24T16:00:00.000Z",
    capacity: 200,
    posterUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&q=80",
    isPublished: true,
    registrations: [],
    createdAt: "2026-09-03T10:00:00.000Z",
    updatedAt: "2026-09-06T12:00:00.000Z",
  },
  {
    id: "evt-009",
    slug: "robotics-iot-hardware-lab",
    title: "Autonomous Rovers: Embedded ESP32 & ROS2 Hardware Workshop",
    summary: "Hands-on robotics laboratory where participants build and flash firmware on line-following LIDAR rovers.",
    description: `### Embedded Systems & Autonomous Navigation
Build real hardware prototypes! Each team receives an ESP32 microcontroller kit with ultrasonic sensors, optical encoders, and motor drivers.
Code in C++ using FreeRTOS and connect telemetry back to a centralized dashboard.`,
    category: EventCategory.TECHNICAL,
    status: EventStatus.REGISTRATION_OPEN,
    organizerId: "demo-club-001",
    organizerName: "Ananya Deshmukh (Coding & Robotics Club Lead)",
    organizerRole: "CLUB_COORDINATOR",
    venue: "Robotics & Mechatronics Lab, Central Workshop",
    eventDate: "2026-10-24T10:00:00.000Z",
    startDateTime: "2026-10-24T10:00:00.000Z",
    endDateTime: "2026-10-24T16:00:00.000Z",
    registrationOpenAt: "2026-09-10T00:00:00.000Z",
    registrationDeadline: "2026-10-22T20:00:00.000Z",
    capacity: 35,
    posterUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&q=80",
    isPublished: true,
    registrations: [],
    createdAt: "2026-09-07T08:00:00.000Z",
    updatedAt: "2026-09-09T09:00:00.000Z",
  },
  {
    id: "evt-010",
    slug: "cloud-security-penetration-testing",
    title: "Zero-Day Defense: Ethical Hacking & Cloud Infrastructure Security",
    summary: "Nearly full workshop on web application vulnerability exploitation, SQL injection, and AWS IAM misconfigurations.",
    description: `### Offensive Security & Penetration Testing
Learn security from the offensive perspective to build resilient defenses.
Participate in our live simulated CTF (Capture the Flag) arena.`,
    category: EventCategory.WORKSHOP,
    status: EventStatus.REGISTRATION_OPEN,
    organizerId: "demo-faculty-001",
    organizerName: "Prof. Meera Sen (Associate Professor)",
    organizerRole: "FACULTY",
    venue: "Network Security Lab 401",
    eventDate: "2026-09-30T13:30:00.000Z",
    startDateTime: "2026-09-30T13:30:00.000Z",
    endDateTime: "2026-09-30T17:30:00.000Z",
    registrationOpenAt: "2026-09-01T00:00:00.000Z",
    registrationDeadline: "2026-09-29T23:59:59.000Z",
    capacity: 20, // 18 registered -> Nearly Full (90%)
    posterUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&q=80",
    isPublished: true,
    registrations: Array.from({ length: 18 }, (_, i) => ({
      id: `reg-010-${i + 1}`,
      eventId: "evt-010",
      userId: `user-sec-${i + 1}`,
      studentId: `STU-SEC-${i + 1}`,
      userName: `Student Attendee ${i + 1}`,
      userEmail: `attendee${i + 1}@campussphere.edu`,
      rollNumber: `22SEC${100 + i}`,
      departmentName: "Information Technology",
      semester: 6,
      confirmationCode: `CS-SEC-09${i}A`,
      registeredAt: "2026-09-05T12:00:00.000Z",
      status: RegistrationStatus.REGISTERED,
      attendanceStatus: EventAttendanceStatus.UNMARKED,
    })),
    createdAt: "2026-09-01T12:00:00.000Z",
    updatedAt: "2026-09-08T11:00:00.000Z",
  },
  {
    id: "evt-011",
    slug: "executive-leadership-roundtable",
    title: "Global Leadership Roundtable: Building Tech Ventures in Silicon Valley",
    summary: "Exclusive capacity-limited symposium with serial founders and venture capital partners. Capacity: 10/10 (Event Full).",
    description: `### High-Impact Entrepreneurship Symposium
Strictly limited to 10 students with active startup prototypes or patents.
This session is fully booked.`,
    category: EventCategory.CLUB,
    status: EventStatus.REGISTRATION_OPEN,
    organizerId: "demo-club-001",
    organizerName: "Ananya Deshmukh (Coding & Robotics Club Lead)",
    organizerRole: "CLUB_COORDINATOR",
    venue: "Boardroom 5, Executive Tower",
    eventDate: "2026-10-12T16:00:00.000Z",
    startDateTime: "2026-10-12T16:00:00.000Z",
    endDateTime: "2026-10-12T18:00:00.000Z",
    registrationOpenAt: "2026-09-01T00:00:00.000Z",
    registrationDeadline: "2026-10-10T12:00:00.000Z",
    capacity: 10, // 10 registered -> Event Full (100%)
    posterUrl: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&q=80",
    isPublished: true,
    registrations: Array.from({ length: 10 }, (_, i) => ({
      id: `reg-011-${i + 1}`,
      eventId: "evt-011",
      userId: `user-lead-${i + 1}`,
      studentId: `STU-LEAD-${i + 1}`,
      userName: `Founder Student ${i + 1}`,
      userEmail: `founder${i + 1}@campussphere.edu`,
      rollNumber: `22ENT${200 + i}`,
      departmentName: "Computer Engineering",
      semester: 6,
      confirmationCode: `CS-LEAD-55${i}Z`,
      registeredAt: "2026-09-03T10:00:00.000Z",
      status: RegistrationStatus.REGISTERED,
      attendanceStatus: EventAttendanceStatus.UNMARKED,
    })),
    createdAt: "2026-08-30T09:00:00.000Z",
    updatedAt: "2026-09-04T12:00:00.000Z",
  },
  {
    id: "evt-012",
    slug: "blood-donation-social-drive",
    title: "Youth Red Cross Campus Blood Donation & Health Screening Drive",
    summary: "Annual community outreach initiative organized in partnership with Red Cross Society and Civil Hospital.",
    description: `### Give Blood, Save Lives
Every donor receives a donor card, health report, and certificate of civic recognition.
Free BMI, blood glucose, and hemoglobin screenings provided for all faculty and students.`,
    category: EventCategory.OTHER,
    status: EventStatus.REGISTRATION_OPEN,
    organizerId: "demo-admin-001",
    organizerName: "Campus Health & Welfare Committee",
    organizerRole: "ADMIN",
    venue: "Student Activity Center (SAC Ground Floor)",
    eventDate: "2026-10-14T09:00:00.000Z",
    startDateTime: "2026-10-14T09:00:00.000Z",
    endDateTime: "2026-10-14T17:00:00.000Z",
    registrationOpenAt: "2026-09-01T00:00:00.000Z",
    registrationDeadline: "2026-10-13T20:00:00.000Z",
    capacity: 250,
    posterUrl: "https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=1200&q=80",
    isPublished: true,
    registrations: [],
    createdAt: "2026-09-02T10:00:00.000Z",
    updatedAt: "2026-09-05T12:00:00.000Z",
  },
  {
    id: "evt-013",
    slug: "fintech-blockchain-smart-contracts",
    title: "FinTech & Smart Contract Architecture in Solidity",
    summary: "Past completed technical workshop on EVM opcode internals and secure automated smart contract auditing.",
    description: `### Completed Workshop Archive
Hands-on coding session exploring ERC-20, ERC-721 token standards and reentrancy attack vectors.
Attendance records and verified completion certificates archived.`,
    category: EventCategory.WORKSHOP,
    status: EventStatus.COMPLETED,
    organizerId: "demo-faculty-001",
    organizerName: "Prof. Meera Sen (Associate Professor)",
    organizerRole: "FACULTY",
    venue: "Lab 301, Tech Annex",
    eventDate: "2026-08-25T14:00:00.000Z",
    startDateTime: "2026-08-25T14:00:00.000Z",
    endDateTime: "2026-08-25T18:00:00.000Z",
    registrationOpenAt: "2026-08-01T00:00:00.000Z",
    registrationDeadline: "2026-08-24T18:00:00.000Z",
    capacity: 30,
    posterUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&q=80",
    isPublished: true,
    registrations: [
      {
        id: "reg-013-01",
        eventId: "evt-013",
        userId: "demo-student-001",
        studentId: "STU-2022-0101",
        userName: "Aarav Mehta",
        userEmail: "student@campussphere.edu",
        rollNumber: "22COMPA101",
        departmentName: "Computer Engineering",
        semester: 6,
        confirmationCode: "CS-FINT-1011P",
        registeredAt: "2026-08-10T11:00:00.000Z",
        status: RegistrationStatus.ATTENDED,
        attendanceStatus: EventAttendanceStatus.PRESENT,
        attendedAt: "2026-08-25T14:10:00.000Z",
        markedBy: "demo-faculty-001",
      },
      {
        id: "reg-013-02",
        eventId: "evt-013",
        userId: "demo-student-002",
        studentId: "STU-2022-0102",
        userName: "Priya Nair",
        userEmail: "priya.nair@campussphere.edu",
        rollNumber: "22COMPA102",
        departmentName: "Computer Engineering",
        semester: 6,
        confirmationCode: "CS-FINT-1012Q",
        registeredAt: "2026-08-11T14:00:00.000Z",
        status: RegistrationStatus.ATTENDED,
        attendanceStatus: EventAttendanceStatus.PRESENT,
        attendedAt: "2026-08-25T14:12:00.000Z",
        markedBy: "demo-faculty-001",
      },
      {
        id: "reg-013-03",
        eventId: "evt-013",
        userId: "demo-student-003",
        studentId: "STU-2022-0103",
        userName: "Rohan Varma",
        userEmail: "rohan.varma@campussphere.edu",
        rollNumber: "22COMPA103",
        departmentName: "Computer Engineering",
        semester: 6,
        confirmationCode: "CS-FINT-1013R",
        registeredAt: "2026-08-12T09:30:00.000Z",
        status: RegistrationStatus.REGISTERED,
        attendanceStatus: EventAttendanceStatus.ABSENT,
        markedBy: "demo-faculty-001",
      },
    ],
    createdAt: "2026-08-01T08:00:00.000Z",
    updatedAt: "2026-08-26T10:00:00.000Z",
  },
  {
    id: "evt-014",
    slug: "ai-prompt-engineering-mastery",
    title: "Draft Event: Advanced LLM Prompt Engineering & Context Caching",
    summary: "Internal curriculum draft for upcoming faculty & senior student certification workshop.",
    description: `### Internal Draft Event Proposal
Testing prompt injection defense, structured JSON schema generation, and semantic caching layers.
Not yet published for public student discovery.`,
    category: EventCategory.WORKSHOP,
    status: EventStatus.DRAFT,
    organizerId: "demo-faculty-001",
    organizerName: "Prof. Meera Sen (Associate Professor)",
    organizerRole: "FACULTY",
    venue: "Lab 204, Software Wing",
    eventDate: "2026-11-05T14:00:00.000Z",
    startDateTime: "2026-11-05T14:00:00.000Z",
    endDateTime: "2026-11-05T17:00:00.000Z",
    registrationOpenAt: "2026-10-01T00:00:00.000Z",
    registrationDeadline: "2026-11-04T18:00:00.000Z",
    capacity: 25,
    posterUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80",
    isPublished: false,
    registrations: [],
    createdAt: "2026-09-08T10:00:00.000Z",
    updatedAt: "2026-09-08T10:00:00.000Z",
  },
  {
    id: "evt-015",
    slug: "alumni-tech-mentorship-mixer",
    title: "Alumni Evening: Silicon Valley & Global Tech Mentorship Mixer",
    summary: "Registration closed past networking event connecting current pre-final year students with tech leaders.",
    description: `### Registration Closed Event
All seats for this mentor dinner have been allocated. Attendance recorded and archived.`,
    category: EventCategory.CLUB,
    status: EventStatus.REGISTRATION_CLOSED,
    organizerId: "demo-placement-001",
    organizerName: "Vikramaditya Nair (Chief Placement Officer)",
    organizerRole: "PLACEMENT_OFFICER",
    venue: "University Guest House Banquet Hall",
    eventDate: "2026-09-20T19:00:00.000Z",
    startDateTime: "2026-09-20T19:00:00.000Z",
    endDateTime: "2026-09-20T21:30:00.000Z",
    registrationOpenAt: "2026-08-15T00:00:00.000Z",
    registrationDeadline: "2026-09-10T12:00:00.000Z",
    capacity: 40,
    posterUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&q=80",
    isPublished: true,
    registrations: [],
    createdAt: "2026-08-10T09:00:00.000Z",
    updatedAt: "2026-09-11T12:00:00.000Z",
  },
  {
    id: "evt-016",
    slug: "quantum-computing-algorithms",
    title: "Special Colloquium: Quantum Algorithms & Qubit Annealing",
    summary: "Archived historical symposium on Shor's and Grover's quantum gate algorithms.",
    description: `### Archived Symposium
Event concluded and archived for research repository records.`,
    category: EventCategory.SEMINAR,
    status: EventStatus.ARCHIVED,
    organizerId: "demo-admin-001",
    organizerName: "Dr. Rajeshwar Sharma (Dean & Admin Lead)",
    organizerRole: "ADMIN",
    venue: "Department Seminar Hall 3",
    eventDate: "2026-07-15T11:00:00.000Z",
    startDateTime: "2026-07-15T11:00:00.000Z",
    endDateTime: "2026-07-15T13:00:00.000Z",
    registrationOpenAt: "2026-06-15T00:00:00.000Z",
    registrationDeadline: "2026-07-14T18:00:00.000Z",
    capacity: 80,
    posterUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&q=80",
    isPublished: true,
    registrations: [],
    createdAt: "2026-06-10T08:00:00.000Z",
    updatedAt: "2026-07-16T10:00:00.000Z",
  },
];

// In-memory persistent demo store
export let DEMO_EVENTS_STORE: DemoEvent[] = JSON.parse(JSON.stringify(INITIAL_DEMO_EVENTS));

export function resetDemoEventsStore() {
  DEMO_EVENTS_STORE = JSON.parse(JSON.stringify(INITIAL_DEMO_EVENTS));
}
