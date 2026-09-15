import { requireRole } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { StudentClaimsTracker } from "@/components/lost-found/student-claims-tracker";

export const metadata = {
  title: "My Recovery Claims | CampusSphere",
  description: "Monitor verification status, admin reviews, and handover scheduling for submitted claims.",
};

export default async function StudentClaimsPage() {
  await requireRole([Role.STUDENT, Role.FACULTY, Role.ADMIN]);
  return <StudentClaimsTracker />;
}
