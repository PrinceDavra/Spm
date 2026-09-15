import { requireRole } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { AdminLostFoundDashboard } from "@/components/lost-found/admin-lost-found-dashboard";

export const metadata = {
  title: "Lost & Found Governance & Moderation | CampusSphere",
  description: "Institutional lost & found repository, report moderation, and campus recovery metrics.",
};

export default async function AdminLostFoundPage() {
  await requireRole([Role.ADMIN]);
  return <AdminLostFoundDashboard />;
}
