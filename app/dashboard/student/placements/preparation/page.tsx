import { requireRole } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { StudentPrepBank } from "@/components/placement/student-prep-bank";

export const metadata = {
  title: "Placement Preparation Bank | CampusSphere",
  description: "Practice quantitative, logical, technical, and HR questions with interactive verification.",
};

export default async function StudentPrepBankPage() {
  await requireRole([Role.STUDENT]);
  return <StudentPrepBank />;
}
