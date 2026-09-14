import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import { EventService } from "@/services/event.service";
import { FacultyEventManager } from "@/components/events/faculty-event-manager";

export default async function ClubEventsPage() {
  const user = await requireRole([Role.CLUB_COORDINATOR, Role.ADMIN]);

  const { events } = await EventService.getEvents({
    userId: user.id,
    role: user.role,
    limit: 100,
  });

  const summary = await EventService.getOrganizerSummary(user.id, user.role);

  return (
    <FacultyEventManager
      initialEvents={events as any}
      currentUserId={user.id}
      currentUserRole={user.role}
      summary={summary}
    />
  );
}
