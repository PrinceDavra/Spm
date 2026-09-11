import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import { ProfileService } from "@/services/profile.service";
import { FacultyProfileView } from "@/components/profile/faculty-profile-view";
import { notFound } from "next/navigation";

export default async function FacultyProfilePage() {
  const sessionUser = await requireRole([Role.FACULTY, Role.ADMIN]);
  const profile = await ProfileService.getProfile(sessionUser.id);

  if (!profile) {
    notFound();
  }

  return <FacultyProfileView initialProfile={profile} />;
}
