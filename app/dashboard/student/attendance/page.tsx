import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import { AttendanceService } from "@/services/attendance.service";
import { StudentAttendanceView } from "@/components/attendance/student-attendance-view";

export const metadata = {
  title: "My Attendance & Projection | CampusSphere",
  description: "View subject-wise attendance, calendar breakdown, history, and real-time projection simulator.",
};

export default async function StudentAttendancePage() {
  const sessionUser = await requireRole([Role.STUDENT, Role.ADMIN]);

  const summary = await AttendanceService.getStudentSummary(sessionUser.id);
  const history = await AttendanceService.getStudentHistory(sessionUser.id);
  const calendar = await AttendanceService.getStudentCalendar(sessionUser.id, 2026, 9);

  return (
    <div className="space-y-6">
      <StudentAttendanceView
        initialSummary={summary}
        initialHistory={history}
        initialCalendar={calendar}
      />
    </div>
  );
}
