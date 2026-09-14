import { requireRole } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { StudentApplicationTracker } from "@/components/placement/student-application-tracker";

export const metadata = {
  title: "Application Pipeline Tracker | CampusSphere",
  description: "Monitor official application stages, shortlists, assessment invites, offers, and audit remarks.",
};

export default async function StudentApplicationsPage() {
  await requireRole([Role.STUDENT]);
  return <StudentApplicationTracker />;
}
