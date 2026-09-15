import { requireRole } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { StudentLostFoundHub } from "@/components/lost-found/student-lost-found-hub";

export const metadata = {
  title: "Campus Lost & Found | CampusSphere",
  description: "Community-driven lost and found board with deterministic matching and verified claim recovery.",
};

export default async function StudentLostFoundPage() {
  await requireRole([Role.STUDENT, Role.FACULTY, Role.ADMIN]);
  return <StudentLostFoundHub />;
}
