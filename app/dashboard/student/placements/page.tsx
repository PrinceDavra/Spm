import { requireRole } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { StudentPlacementHub } from "@/components/placement/student-placement-hub";

export const metadata = {
  title: "Placement Hub & Drives | CampusSphere",
  description: "Discover verified on-campus placement drives, check transparent eligibility, and track applications.",
};

export default async function StudentPlacementPage() {
  await requireRole([Role.STUDENT]);
  return <StudentPlacementHub />;
}
