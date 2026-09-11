import { Role } from "@prisma/client";

export interface DemoUser {
  id: string;
  email: string;
  passwordPlainText: string;
  passwordHash: string;
  role: Role;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  phone: string;
  departmentName?: string;
  designation?: string;
  // Student Specific
  studentId?: string;
  rollNumber?: string;
  prnNumber?: string;
  semester?: number;
  division?: string;
  batchYear?: string;
  cgpa?: number;
  skills?: string[];
  bio?: string;
  // Faculty Specific
  facultyId?: string;
  employeeId?: string;
  qualification?: string;
  specialization?: string;
  officeRoom?: string;
}

// In-memory persistent demo store
export const DEMO_USERS: DemoUser[] = [
  {
    id: "demo-admin-001",
    email: "admin@campussphere.edu",
    passwordPlainText: "AdminPassword@123",
    passwordHash: "$2a$10$vN0dYx0eZ2hXw.g7kU2fC.B2e4vQ6Qp9GZgT.P3P9T8U7v2l3QvGy",
    role: Role.ADMIN,
    firstName: "Dr. Rajeshwar",
    lastName: "Sharma",
    phone: "+91 98201 12345",
    designation: "Dean of Academic Governance & Admin Lead",
    bio: "Head Administrator with full institutional management privileges across all academic departments.",
    avatarUrl: null,
  },
  {
    id: "demo-student-001",
    email: "student@campussphere.edu",
    passwordPlainText: "StudentPassword@123",
    passwordHash: "$2a$10$O0F9mE2Tq7H4aW9Zk1cEw.wP3lJ7rB9sM4zF5tH8vK2xQ6gL9mN4u",
    role: Role.STUDENT,
    firstName: "Aarav",
    lastName: "Mehta",
    phone: "+91 98765 43210",
    departmentName: "Computer Engineering",
    studentId: "STU-2022-0101",
    rollNumber: "22COMPA101",
    prnNumber: "PRN2022014589",
    semester: 6,
    division: "Division A",
    batchYear: "2022-2026",
    cgpa: 8.74,
    skills: ["Next.js", "TypeScript", "PostgreSQL", "Data Structures", "Docker", "React"],
    bio: "Third Year Computer Engineering student focusing on Distributed Systems, Cloud Architecture, and Web Development.",
    avatarUrl: null,
  },
  {
    id: "demo-faculty-001",
    email: "faculty@campussphere.edu",
    passwordPlainText: "FacultyPassword@123",
    passwordHash: "$2a$10$S9zL3mQ1kR4vW7xP5eJ8tu3G2hY6rT9wE4nB7vC1xZ8mQ4pK2lD0e",
    role: Role.FACULTY,
    firstName: "Prof. Meera",
    lastName: "Sen",
    phone: "+91 94220 54321",
    departmentName: "Computer Engineering",
    facultyId: "FAC-2018-042",
    employeeId: "EMP-CS-042",
    designation: "Associate Professor",
    qualification: "Ph.D. in Computer Science (IIT Bombay)",
    specialization: "Distributed Systems, DBMS & Computer Networks",
    officeRoom: "Room 408, Faculty Annex Building",
    bio: "Over 12 years of teaching and research experience in Distributed Consensus and Cloud Database Architectures.",
    avatarUrl: null,
  },
  {
    id: "demo-placement-001",
    email: "placement@campussphere.edu",
    passwordPlainText: "PlacementPassword@123",
    passwordHash: "$2a$10$K7wP2mE9rL4tQ8yU1cO3re5H8gN2vF7sT6wE3nB9vX4kM1zL0jP5a",
    role: Role.PLACEMENT_OFFICER,
    firstName: "Vikramaditya",
    lastName: "Nair",
    phone: "+91 98111 22334",
    designation: "Chief Corporate Relations & Placement Officer",
    bio: "Leading campus placement drives, technical aptitude assessment, and corporate recruitment partnerships.",
    avatarUrl: null,
  },
  {
    id: "demo-club-001",
    email: "club@campussphere.edu",
    passwordPlainText: "ClubPassword@123",
    passwordHash: "$2a$10$V3xN8mK2rP5tQ9yW4eL1ze7H4gM6vB2sT9wE1nB5vC8kM3zL6jR2b",
    role: Role.CLUB_COORDINATOR,
    firstName: "Ananya",
    lastName: "Deshmukh",
    phone: "+91 97654 32109",
    designation: "President, Coding & Robotics Club",
    departmentName: "Information Technology",
    bio: "Student Lead orchestrating hackathons, open-source workshops, and technical symposiums.",
    avatarUrl: null,
  },
];
