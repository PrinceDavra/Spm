import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import { ClubService } from "@/services/club.service";
import { StudentMyClubs } from "@/components/club/student-my-clubs";

export default async function StudentMyClubsPage() {
  const user = await requireRole([Role.STUDENT, Role.ADMIN]);

  const { active, pending, previous } = await ClubService.getUserClubs(user.id);

  return (
    <StudentMyClubs
      activeClubs={active}
      pendingClubs={pending}
      previousClubs={previous}
    />
  );
}
