import { requireRole } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { StudentReportWizard } from "@/components/lost-found/student-report-wizard";

export const metadata = {
  title: "Report Lost or Found Item | CampusSphere",
  description: "Step-by-step reporting wizard for lost personal belongings and found campus items.",
};

export default async function StudentReportPage() {
  await requireRole([Role.STUDENT, Role.FACULTY, Role.ADMIN]);
  return <StudentReportWizard />;
}
