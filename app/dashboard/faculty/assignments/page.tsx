import { requireRole } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { AssignmentService } from "@/services/assignment.service";
import { DEMO_FACULTY_SUBJECTS } from "@/lib/attendance/demo-attendance";
import { FacultyAssignmentManager } from "@/components/assignments/faculty-assignment-manager";

export default async function FacultyAssignmentsPage() {
  const user = await requireRole([Role.FACULTY, Role.ADMIN]);

  const assignments = await AssignmentService.getFacultyAssignments(user.id, user.role);

  const mappedSubjects = DEMO_FACULTY_SUBJECTS.filter(
    (fs) => user.role === Role.ADMIN || fs.facultyId === user.id
  ).map((fs) => ({
    id: fs.id,
    code: fs.code,
    name: fs.name,
    divisionId: fs.divisionId,
    divisionName: fs.divisionName,
  }));

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <FacultyAssignmentManager
        initialAssignments={assignments}
        facultyId={user.id}
        mappedSubjects={mappedSubjects}
      />
    </div>
  );
}
