import { Metadata } from "next";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import { StudentAnalyticsView } from "@/components/analytics/student-analytics-view";

export const metadata: Metadata = {
  title: "Academic Analytics & Progress | CampusSphere",
  description:
    "Personal student analytics: attendance health, mathematical projection, assignment completion, and placement readiness.",
};

export default async function StudentAnalyticsPage() {
  await requireRole([Role.STUDENT, Role.ADMIN]);

  return <StudentAnalyticsView />;
}
