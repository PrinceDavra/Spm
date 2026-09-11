import { requireRole } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { AssignmentService } from "@/services/assignment.service";
import { FacultyGradingDrawer } from "@/components/assignments/faculty-grading-drawer";
import { notFound } from "next/navigation";

export default async function FacultyAssignmentSubmissionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole([Role.FACULTY, Role.ADMIN]);
  const { id } = await params;

  try {
    const { assignment, roster } = await AssignmentService.getAssignmentSubmissions(
      user.id,
      user.role,
      id
    );

    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <FacultyGradingDrawer
          assignment={assignment}
          initialRoster={roster}
        />
      </div>
    );
  } catch {
    notFound();
  }
}
