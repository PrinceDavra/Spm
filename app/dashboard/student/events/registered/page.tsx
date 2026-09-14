import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import { EventService } from "@/services/event.service";
import { StudentMyEvents } from "@/components/events/student-my-events";

export default async function StudentRegisteredEventsPage() {
  const user = await requireRole([Role.STUDENT, Role.ADMIN]);

  const { upcoming, past } = await EventService.getUserRegistrations(user.id);

  return (
    <StudentMyEvents
      upcomingEvents={upcoming as any}
      pastEvents={past as any}
    />
  );
}
