import { Role } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/rbac";
import { EventService } from "@/services/event.service";
import { ParticipantManager } from "@/components/events/participant-manager";

export default async function EventParticipantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole([
    Role.FACULTY,
    Role.ADMIN,
    Role.CLUB_COORDINATOR,
    Role.PLACEMENT_OFFICER,
  ]);
  const { id } = await params;

  const event = await EventService.getEventById(id, user.id, user.role);
  if (!event) {
    notFound();
  }

  // Security authorization: only organizer or admin can access participant roster
  if (user.role !== Role.ADMIN && event.organizerId !== user.id) {
    redirect("/dashboard/faculty/events");
  }

  const { participants } = await EventService.getParticipants(id, user.id, user.role);
  const analytics = await EventService.getEventAnalytics(id, user.id, user.role);

  return (
    <ParticipantManager
      eventId={event.id}
      eventTitle={event.title}
      eventDate={event.startDateTime}
      venue={event.venue}
      capacity={event.capacity}
      initialParticipants={participants as any}
      analytics={analytics}
    />
  );
}
