import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import { AttendanceService } from "@/services/attendance.service";
import { FacultyAttendanceRegister } from "@/components/attendance/faculty-attendance-register";

export const metadata = {
  title: "Mark Class Attendance | CampusSphere",
  description: "Record class attendance, load enrolled division student rosters, and finalize lecture sessions.",
};

export default async function FacultyMarkAttendancePage() {
  const sessionUser = await requireRole([Role.FACULTY, Role.ADMIN]);

  const assignedSubjects = await AttendanceService.getFacultySubjects(sessionUser.id);

  return (
    <div className="space-y-6">
      <FacultyAttendanceRegister assignedSubjects={assignedSubjects} />
    </div>
  );
}
