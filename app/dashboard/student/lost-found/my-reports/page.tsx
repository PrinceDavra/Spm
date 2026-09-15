import { requireRole } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { StudentMyReports } from "@/components/lost-found/student-my-reports";

export const metadata = {
  title: "My Lost & Found Reports | CampusSphere",
  description: "Track, manage, publish, and archive your personal lost item reports and found item notifications.",
};

export default async function StudentMyReportsPage() {
  await requireRole([Role.STUDENT, Role.FACULTY, Role.ADMIN]);
  return <StudentMyReports />;
}
