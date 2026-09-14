import { Role } from "@prisma/client";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/rbac";
import { EventService } from "@/services/event.service";
import { StudentEventDetail } from "@/components/events/student-event-detail";

export default async function StudentEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole([Role.STUDENT, Role.ADMIN]);
  const { id } = await params;

  const event = await EventService.getEventById(id, user.id, user.role);

  if (!event) {
    notFound();
  }

  return <StudentEventDetail event={event} currentUserId={user.id} />;
}
