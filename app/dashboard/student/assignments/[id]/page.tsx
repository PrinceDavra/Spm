import { requireRole } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { AssignmentService } from "@/services/assignment.service";
import { StudentAssignmentDetail } from "@/components/assignments/student-assignment-detail";
import { notFound } from "next/navigation";

export default async function StudentAssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole([Role.STUDENT, Role.ADMIN]);
  const { id } = await params;

  try {
    const details = await AssignmentService.getAssignmentDetails(user.id, user.role, id);

    return (
      <div className="p-4 sm:p-6">
        <StudentAssignmentDetail
          assignment={details.assignment}
          initialSubmission={details.submission}
          urgencyText={details.urgencyText}
          isUrgent={details.isUrgent}
          isOverdue={details.isOverdue}
          canSubmit={details.canSubmit}
        />
      </div>
    );
  } catch {
    notFound();
  }
}
