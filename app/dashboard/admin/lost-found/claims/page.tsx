import { requireRole } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { AdminClaimsDesk } from "@/components/lost-found/admin-claims-desk";

export const metadata = {
  title: "Claim Verification & Handover Desk | CampusSphere",
  description: "Review submitted verification statements, approve legitimate claims, and record secure physical handovers.",
};

export default async function AdminClaimsDeskPage() {
  await requireRole([Role.ADMIN]);
  return <AdminClaimsDesk />;
}
