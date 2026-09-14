import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import { EventService } from "@/services/event.service";
import { StudentEventDiscovery } from "@/components/events/student-event-discovery";

export default async function StudentEventsPage() {
  const user = await requireRole([Role.STUDENT, Role.ADMIN]);

  const { events } = await EventService.getEvents({
    userId: user.id,
    role: user.role,
    limit: 100,
  });

  return (
    <StudentEventDiscovery
      initialEvents={events}
      currentUserId={user.id}
    />
  );
}
