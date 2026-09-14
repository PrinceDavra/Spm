import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import { OfficerAnalyticsView } from "@/components/placement/officer-analytics-view";

export const metadata = {
  title: "Placement Analytics & Funnel | CampusSphere",
  description: "Institutional recruitment outcomes, hiring conversion rates, and package distributions.",
};

export default async function OfficerAnalyticsPage() {
  await requireRole([Role.PLACEMENT_OFFICER, Role.ADMIN]);
  return <OfficerAnalyticsView />;
}
