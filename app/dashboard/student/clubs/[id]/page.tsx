import { Role } from "@prisma/client";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/rbac";
import { ClubService } from "@/services/club.service";
import { StudentClubDetail } from "@/components/club/student-club-detail";

export default async function StudentClubDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole([
    Role.STUDENT,
    Role.FACULTY,
    Role.CLUB_COORDINATOR,
    Role.PLACEMENT_OFFICER,
    Role.ADMIN,
  ]);
  const { id } = await params;

  const club = await ClubService.getClubById(id, user.id, user.role);

  if (!club) {
    notFound();
  }

  return <StudentClubDetail club={club} currentUserId={user.id} />;
}
