import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import { ClubService } from "@/services/club.service";
import { StudentClubDiscovery } from "@/components/club/student-club-discovery";

export default async function StudentClubsPage() {
  const user = await requireRole([Role.STUDENT, Role.ADMIN]);

  const { clubs } = await ClubService.getClubs({
    userId: user.id,
    role: user.role,
    limit: 100,
  });

  return (
    <StudentClubDiscovery
      initialClubs={clubs}
      currentUserId={user.id}
    />
  );
}
