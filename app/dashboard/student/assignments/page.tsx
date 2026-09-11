import { requireRole } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { AssignmentService } from "@/services/assignment.service";
import { StudentAssignmentHub } from "@/components/assignments/student-assignment-hub";

export default async function StudentAssignmentsPage() {
  const user = await requireRole([Role.STUDENT, Role.ADMIN]);

  const data = await AssignmentService.getStudentAssignments(user.id);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <StudentAssignmentHub
        initialAssignments={data.assignments}
        initialKpi={data.kpi}
      />
    </div>
  );
}
