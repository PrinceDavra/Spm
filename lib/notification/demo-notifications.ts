import { NotificationType, NotificationPriority, PreferenceChannel } from "@prisma/client";

export interface DemoNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  link: string | null;
  isRead: boolean;
  readAt: string | null;
  sourceEntity: string | null;
  sourceId: string | null;
  dedupKey: string | null;
  groupKey: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface DemoNotificationPreference {
  id: string;
  userId: string;
  category: NotificationType;
  channel: PreferenceChannel;
  createdAt: string;
  updatedAt: string;
}

export const INITIAL_DEMO_NOTIFICATIONS: DemoNotification[] = [
  // 1. Student Notifications
  {
    id: "notif-student-001",
    userId: "demo-student-001",
    title: "Assignment Deadline Approaching",
    message: "Data Structures & Algorithms Assignment 3 is due tomorrow at 11:59 PM.",
    type: NotificationType.ASSIGNMENT,
    priority: NotificationPriority.HIGH,
    link: "/dashboard/student/assignments",
    isRead: false,
    readAt: null,
    sourceEntity: "ASSIGNMENT",
    sourceId: "asgn-001",
    dedupKey: "demo-student-001:ASSIGNMENT:ASSIGNMENT:asgn-001:DEADLINE",
    groupKey: "ASSIGNMENT:asgn-001",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
  },
  {
    id: "notif-student-002",
    userId: "demo-student-001",
    title: "Attendance Warning Notice",
    message: "Your overall attendance in Operating Systems is 68.5% (Below the 75% safe requirement).",
    type: NotificationType.ATTENDANCE,
    priority: NotificationPriority.URGENT,
    link: "/dashboard/student/attendance",
    isRead: false,
    readAt: null,
    sourceEntity: "ATTENDANCE",
    sourceId: "att-subj-os",
    dedupKey: "demo-student-001:ATTENDANCE:ATTENDANCE:att-subj-os:WARNING",
    groupKey: "ATTENDANCE",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: "notif-student-003",
    userId: "demo-student-001",
    title: "Campus Notice: End-Semester Exam Schedule",
    message: "The final exam timetable for Semester 6 has been released by the Academic Dean.",
    type: NotificationType.NOTICE,
    priority: NotificationPriority.HIGH,
    link: "/dashboard/student/notices",
    isRead: false,
    readAt: null,
    sourceEntity: "NOTICE",
    sourceId: "notice-001",
    dedupKey: "demo-student-001:NOTICE:NOTICE:notice-001:PUBLISH",
    groupKey: "NOTICE",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
  },
  {
    id: "notif-student-004",
    userId: "demo-student-001",
    title: "Campus Event: Annual Hackathon 2026",
    message: "Registration is now open for InnovateX 2026 Hackathon. Reserve your team spot.",
    type: NotificationType.EVENT,
    priority: NotificationPriority.NORMAL,
    link: "/dashboard/student/events",
    isRead: true,
    readAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    sourceEntity: "EVENT",
    sourceId: "event-001",
    dedupKey: "demo-student-001:EVENT:EVENT:event-001:INVITE",
    groupKey: "EVENT",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
  },
  {
    id: "notif-student-005",
    userId: "demo-student-001",
    title: "Placement Alert: Google SWE Internship Drive",
    message: "You meet eligibility criteria (CGPA > 8.0). Applications close in 3 days.",
    type: NotificationType.PLACEMENT,
    priority: NotificationPriority.HIGH,
    link: "/dashboard/student/placements",
    isRead: false,
    readAt: null,
    sourceEntity: "PLACEMENT",
    sourceId: "drv-001",
    dedupKey: "demo-student-001:PLACEMENT:PLACEMENT:drv-001:ELIGIBLE",
    groupKey: "PLACEMENT",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
  },
  {
    id: "notif-student-006",
    userId: "demo-student-001",
    title: "Club Activity: Robotics Team Meetup",
    message: "Weekly design session scheduled for Wednesday 4:00 PM in Lab 2.",
    type: NotificationType.CLUB,
    priority: NotificationPriority.LOW,
    link: "/dashboard/student/clubs",
    isRead: true,
    readAt: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
    sourceEntity: "CLUB",
    sourceId: "act-001",
    dedupKey: "demo-student-001:CLUB:CLUB:act-001:REMINDER",
    groupKey: "CLUB",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
  },
  {
    id: "notif-student-007",
    userId: "demo-student-001",
    title: "Lost & Found Match Detected",
    message: "An item matching 'Water Bottle' was reported found in Central Library.",
    type: NotificationType.LOST_FOUND,
    priority: NotificationPriority.NORMAL,
    link: "/dashboard/student/lost-found",
    isRead: false,
    readAt: null,
    sourceEntity: "LOST_FOUND",
    sourceId: "lf-001",
    dedupKey: "demo-student-001:LOST_FOUND:LOST_FOUND:lf-001:MATCH",
    groupKey: "LOST_FOUND",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },

  // 2. Faculty Notifications
  {
    id: "notif-faculty-001",
    userId: "demo-faculty-001",
    title: "Pending Assignment Submissions",
    message: "18 new submissions received for Operating Systems Lab 2 ready for review.",
    type: NotificationType.ASSIGNMENT,
    priority: NotificationPriority.NORMAL,
    link: "/dashboard/faculty/assignments",
    isRead: false,
    readAt: null,
    sourceEntity: "ASSIGNMENT",
    sourceId: "asgn-002",
    dedupKey: "demo-faculty-001:ASSIGNMENT:ASSIGNMENT:asgn-002:GRADING",
    groupKey: "ASSIGNMENT",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: "notif-faculty-002",
    userId: "demo-faculty-001",
    title: "Timetable Adjustment Notice",
    message: "Room allocated for Friday 10 AM lecture changed to Seminar Hall B.",
    type: NotificationType.TIMETABLE,
    priority: NotificationPriority.HIGH,
    link: "/dashboard/faculty/timetable",
    isRead: false,
    readAt: null,
    sourceEntity: "TIMETABLE",
    sourceId: "tt-slot-001",
    dedupKey: "demo-faculty-001:TIMETABLE:TIMETABLE:tt-slot-001:CHANGE",
    groupKey: "TIMETABLE",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: "notif-faculty-003",
    userId: "demo-faculty-001",
    title: "Department Meeting Announcement",
    message: "HOD has convened a curriculum review session on Thursday 3 PM.",
    type: NotificationType.ACADEMIC,
    priority: NotificationPriority.HIGH,
    link: "/dashboard/faculty/notices",
    isRead: true,
    readAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    sourceEntity: "ACADEMIC",
    sourceId: "dept-comp-meet",
    dedupKey: "demo-faculty-001:ACADEMIC:ACADEMIC:dept-comp-meet:NOTICE",
    groupKey: "ACADEMIC",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
  },

  // 3. Admin Notifications
  {
    id: "notif-admin-001",
    userId: "demo-admin-001",
    title: "System Health Alert",
    message: "2 subjects currently lack mapped faculty in Semester 6 curriculum.",
    type: NotificationType.ADMIN,
    priority: NotificationPriority.HIGH,
    link: "/dashboard/admin/configuration-health",
    isRead: false,
    readAt: null,
    sourceEntity: "ADMIN",
    sourceId: "health-001",
    dedupKey: "demo-admin-001:ADMIN:ADMIN:health-001:UNMAPPED",
    groupKey: "ADMIN",
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
  },
  {
    id: "notif-admin-002",
    userId: "demo-admin-001",
    title: "Claim Verification Awaiting Review",
    message: "New ownership verification submitted for Lost Laptop case #LF-2026-004.",
    type: NotificationType.LOST_FOUND,
    priority: NotificationPriority.NORMAL,
    link: "/dashboard/admin/lost-found/claims",
    isRead: false,
    readAt: null,
    sourceEntity: "LOST_FOUND",
    sourceId: "claim-001",
    dedupKey: "demo-admin-001:LOST_FOUND:LOST_FOUND:claim-001:REVIEW",
    groupKey: "LOST_FOUND",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
  },
];

export let DEMO_NOTIFICATIONS_STORE: DemoNotification[] = [
  ...INITIAL_DEMO_NOTIFICATIONS.map((n) => ({ ...n })),
];

export let DEMO_PREFERENCES_STORE: DemoNotificationPreference[] = [];

export function resetDemoNotificationsStore() {
  DEMO_NOTIFICATIONS_STORE = INITIAL_DEMO_NOTIFICATIONS.map((n) => ({ ...n }));
  DEMO_PREFERENCES_STORE = [];
}
