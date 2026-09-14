import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import { OfficerDrivesManager } from "@/components/placement/officer-drives-manager";

export const metadata = {
  title: "Placement Drives Manager | CampusSphere",
  description: "Publish on-campus drives, configure academic eligibility criteria, and track applications.",
};

export default async function OfficerDrivesPage() {
  await requireRole([Role.PLACEMENT_OFFICER, Role.ADMIN]);
  return <OfficerDrivesManager />;
}
