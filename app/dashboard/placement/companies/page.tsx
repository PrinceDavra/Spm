import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import { OfficerCompaniesManager } from "@/components/placement/officer-companies-manager";

export const metadata = {
  title: "Corporate Recruiting Partners | CampusSphere",
  description: "Maintain authorized corporate hiring partner organizations and recruiter credentials.",
};

export default async function OfficerCompaniesPage() {
  await requireRole([Role.PLACEMENT_OFFICER, Role.ADMIN]);
  return <OfficerCompaniesManager />;
}
