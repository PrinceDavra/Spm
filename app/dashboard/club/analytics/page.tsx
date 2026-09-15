import { Metadata } from "next";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import { ClubCoordinatorAnalyticsView } from "@/components/analytics/club-analytics-view";

export const metadata: Metadata = {
  title: "Club Engagement Analytics | CampusSphere",
  description:
    "Club chapter telemetry: active memberships, activity scheduling, and deterministic engagement index.",
};

export default async function ClubAnalyticsPage() {
  await requireRole([Role.CLUB_COORDINATOR, Role.ADMIN]);

  return <ClubCoordinatorAnalyticsView />;
}
