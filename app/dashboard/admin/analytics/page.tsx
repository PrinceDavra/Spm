import { Metadata } from "next";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import { AdminAnalyticsView } from "@/components/analytics/admin-analytics-view";

export const metadata: Metadata = {
  title: "Institutional Analytics & Intelligence | CampusSphere",
  description:
    "Executive-level overview of campus operations: attendance health, faculty workload, assignments, placement pipeline, and configuration audits.",
};

export default async function AdminAnalyticsPage() {
  await requireRole([Role.ADMIN]);

  return <AdminAnalyticsView />;
}
