import { Metadata } from "next";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import { FacultyAnalyticsView } from "@/components/analytics/faculty-analytics-view";

export const metadata: Metadata = {
  title: "Faculty Teaching Analytics | CampusSphere",
  description:
    "Teaching workload distribution, class attendance rates, grading backlog metrics, and division student alerts.",
};

export default async function FacultyAnalyticsPage() {
  await requireRole([Role.FACULTY, Role.ADMIN]);

  return <FacultyAnalyticsView />;
}
