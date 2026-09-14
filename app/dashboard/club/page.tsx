import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import { ClubService } from "@/services/club.service";
import { CoordinatorClubStation } from "@/components/club/coordinator-club-station";

export default async function ClubDashboardPage() {
  const user = await requireRole([Role.CLUB_COORDINATOR, Role.ADMIN]);

  // Find club assigned to coordinator (or first active club for admin)
  const { clubs } = await ClubService.getClubs({
    userId: user.id,
    role: user.role,
    limit: 50,
  });

  const assignedClubSummary =
    clubs.find((c) => c.coordinatorId === user.id) ||
    clubs.find((c) => c.slug === "coding-robotics-club") ||
    clubs[0] ||
    null;

  let assignedClubDetail = null;
  if (assignedClubSummary) {
    assignedClubDetail = await ClubService.getClubById(
      assignedClubSummary.id,
      user.id,
      user.role
    );
  }

  return (
    <CoordinatorClubStation
      user={{
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        designation: user.designation,
      }}
      club={assignedClubDetail}
    />
  );
}
