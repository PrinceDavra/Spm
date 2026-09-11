import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import { TimetableService } from "@/services/timetable.service";
import { StudentTimetableView } from "@/components/timetable/student-timetable-view";

export const metadata = {
  title: "Weekly Timetable & Schedule | CampusSphere",
  description: "View published division timetable, classroom allocations, and today's upcoming lectures.",
};

export default async function StudentTimetablePage() {
  const sessionUser = await requireRole([Role.STUDENT, Role.ADMIN]);

  const data = await TimetableService.getStudentTimetable(sessionUser.id);

  return (
    <div className="space-y-6">
      <StudentTimetableView
        divisionName={data.divisionName}
        className={data.className}
        timetable={data.timetable || null}
        todayDay={data.todayDay}
        todaySlots={data.todaySlots}
      />
    </div>
  );
}
