import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import { ProfileService } from "@/services/profile.service";
import { StudentProfileView } from "@/components/profile/student-profile-view";
import { notFound } from "next/navigation";

export default async function StudentProfilePage() {
  const sessionUser = await requireRole([Role.STUDENT, Role.ADMIN]);
  const profile = await ProfileService.getProfile(sessionUser.id);

  if (!profile) {
    notFound();
  }

  return <StudentProfileView initialProfile={profile} />;
}
