import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import { ClubService } from "@/services/club.service";
import { CoordinatorMembersManager } from "@/components/club/coordinator-members-manager";
import { notFound } from "next/navigation";

export default async function CoordinatorMembersPage() {
  const user = await requireRole([Role.CLUB_COORDINATOR, Role.FACULTY, Role.ADMIN]);

  const { clubs } = await ClubService.getClubs({
    userId: user.id,
    role: user.role,
    limit: 50,
  });

  const assignedClub =
    clubs.find((c) => c.coordinatorId === user.id || c.facultyAdvisorId === user.id) ||
    clubs.find((c) => c.slug === "coding-robotics-club") ||
    clubs[0];

  if (!assignedClub) {
    notFound();
  }

  const detail = await ClubService.getClubById(assignedClub.id, user.id, user.role);

  return (
    <CoordinatorMembersManager
      clubId={detail.id}
      clubName={detail.name}
      initialActiveMembers={detail.activeMembers}
      initialPendingMembers={detail.pendingMembers}
    />
  );
}
