import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/rbac";

export default async function DashboardRootPage() {
  const user = await requireAuth();

  const redirectMap: Record<string, string> = {
    STUDENT: "/dashboard/student",
    FACULTY: "/dashboard/faculty",
    ADMIN: "/dashboard/admin",
    PLACEMENT_OFFICER: "/dashboard/placement",
    CLUB_COORDINATOR: "/dashboard/club",
  };

  redirect(redirectMap[user.role] || "/dashboard/student");
}
