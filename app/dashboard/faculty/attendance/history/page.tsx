import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import { AttendanceService } from "@/services/attendance.service";
import { FacultyAttendanceHistoryView } from "@/components/attendance/faculty-attendance-history-view";
import { DEMO_ATTENDANCE_DATABASE } from "@/lib/attendance/demo-attendance";

export const metadata = {
  title: "Attendance Logs & Risk Analytics | CampusSphere",
  description: "Review historical class attendance sessions, debarment risk rankings, and audited attendance adjustments.",
};

export default async function FacultyAttendanceHistoryPage() {
  const sessionUser = await requireRole([Role.FACULTY, Role.ADMIN]);

  const assignedSubjects = await AttendanceService.getFacultySubjects(sessionUser.id);

  let initialAnalytics = null;
  if (assignedSubjects.length > 0) {
    try {
      initialAnalytics = await AttendanceService.getFacultyAnalytics(
        sessionUser.id,
        assignedSubjects[0].facultySubjectId
      );
    } catch {
      initialAnalytics = null;
    }
  }

  // Filter records belonging to this faculty's subjects
  const facultySubjectIds = new Set(assignedSubjects.map((s) => s.facultySubjectId));
  const relevantRecords = DEMO_ATTENDANCE_DATABASE.filter(
    (r) => facultySubjectIds.has(r.facultySubjectId) || sessionUser.role === Role.ADMIN
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <FacultyAttendanceHistoryView
        assignedSubjects={assignedSubjects}
        initialAnalytics={initialAnalytics}
        initialRecords={relevantRecords}
      />
    </div>
  );
}
