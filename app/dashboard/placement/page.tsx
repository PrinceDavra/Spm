import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import { OfficerCommandCenter } from "@/components/placement/officer-command-center";

export const metadata = {
  title: "Placement Command Center | CampusSphere",
  description: "Corporate recruitment command, drive publishing, and candidate pipeline tracking.",
};

export default async function PlacementDashboardPage() {
  const user = await requireRole([Role.PLACEMENT_OFFICER, Role.ADMIN]);
  return <OfficerCommandCenter officerName={`${user.firstName} ${user.lastName}`.trim()} />;
}
